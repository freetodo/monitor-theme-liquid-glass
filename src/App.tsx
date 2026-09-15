import { lazy, Suspense, useCallback, useEffect, useState } from "react"
import { ArrowLeft, Moon, Sparkles, Sun, Wrench } from "lucide-react"

import { NodeCard } from "@/components/NodeCard"
import { Summary } from "@/components/Summary"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LiquidGlassFilterDefs } from "@/components/ui/liquid-glass"
import { Skeleton } from "@/components/ui/skeleton"
import { api, isDemoMode, setDemoMode, useNodes, type Node } from "@/lib/api"
import { DEMO_ME } from "@/lib/mock"

type Me = { authed: boolean; github: boolean; site_name: string; public_page: boolean }

const loadDetail = () => import("@/components/NodeDetail").then((m) => ({ default: m.NodeDetail }))
const NodeDetail = lazy(loadDetail)

function useNodeRoute() {
  const read = () => {
    const match = location.pathname.match(/^\/node\/(\d+)/)
    return match ? Number(match[1]) : null
  }
  const [id, setId] = useState(read)
  useEffect(() => {
    const sync = () => setId(read())
    addEventListener("popstate", sync)
    return () => removeEventListener("popstate", sync)
  }, [])
  return [
    id,
    (next: number | null) => {
      history.pushState({}, "", next === null ? "/" : `/node/${next}`)
      setId(next)
      scrollTo(0, 0)
    },
  ] as const
}

function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme")
    return saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches
  })
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    localStorage.setItem("theme", dark ? "dark" : "light")
  }, [dark])
  return [dark, () => setDark((d) => !d)] as const
}

export default function App() {
  const [dark, toggleTheme] = useTheme()
  const [me, setMe] = useState<Me | null>(null)
  const [meError, setMeError] = useState("")
  const [demo, setDemo] = useState(isDemoMode)
  const { nodes, error, closed } = useNodes()
  const [open, go] = useNodeRoute()

  const loadMe = useCallback(() => {
    if (demo) {
      setMe(DEMO_ME)
      setMeError("")
      return Promise.resolve()
    }
    return api<Me>("/me")
      .then((next) => { setMe(next); setMeError("") })
      .catch((_e: Error) => {
        // Automatically fallback to demo mode when running standalone without hub
        setDemoMode(true)
        setDemo(true)
        setMe(DEMO_ME)
        setMeError("")
      })
  }, [demo])

  useEffect(() => {
    loadMe()
    void loadDetail()
  }, [loadMe])

  useEffect(() => {
    if (closed) void loadMe()
  }, [closed, loadMe])

  useEffect(() => {
    if (me && !me.public_page && !me.authed) location.href = "/admin/"
  }, [me])

  const sorted = [...(nodes ?? [])].sort((a, b) => a.sort - b.sort || a.id - b.id)
  const selected = sorted.find((n) => n.id === open)

  useEffect(() => {
    document.title = [selected?.name, me?.site_name || "Monitor"].filter(Boolean).join(" · ")
  }, [selected?.name, me?.site_name])

  const enableDemo = () => {
    setDemoMode(true)
    setDemo(true)
    setMe(DEMO_ME)
    setMeError("")
    location.reload()
  }

  const exitDemo = () => {
    setDemoMode(false)
    setDemo(false)
    location.reload()
  }

  // Loading or connection error state with Apple Glass card
  if (!me) return (
    <div className="relative grid min-h-svh place-items-center p-6 text-sm">
      <LiquidGlassFilterDefs />
      <div className="ambient-mesh" aria-hidden>
        <div className="ambient-orb ambient-orb-1 -top-20 left-1/4 h-96 w-96 bg-blue-500/25 dark:bg-blue-600/20" />
        <div className="ambient-orb ambient-orb-2 top-1/2 -right-20 h-96 w-96 bg-purple-500/25 dark:bg-purple-600/20" />
      </div>

      <Card className="relative z-10 w-full max-w-sm gap-4 p-6 text-center shadow-xl">
        {meError ? (
          <div className="space-y-4">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
              <Wrench className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">连接服务失败</h3>
              <p className="mt-1 text-xs text-muted-foreground" role="alert">{meError}</p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={loadMe}>重试连接</Button>
              <Button variant="liquid" onClick={enableDemo} className="gap-1.5">
                <Sparkles className="size-3.5 text-amber-500" />
                预览演示模式
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-xs text-muted-foreground">正在载入状态面板…</p>
          </div>
        )}
      </Card>
    </div>
  )

  if (!me.public_page && !me.authed) return null

  return (
    <div className="relative min-h-svh selection:bg-primary/20">
      <LiquidGlassFilterDefs />
      {/* Apple Ambient Mesh Diffuse Background Orbs */}
      <div className="ambient-mesh" aria-hidden>
        <div className="ambient-orb ambient-orb-1 -top-28 left-1/4 h-[32rem] w-[32rem] bg-blue-500/20 dark:bg-blue-600/15" />
        <div className="ambient-orb ambient-orb-2 top-1/3 -right-24 h-[28rem] w-[28rem] bg-purple-500/20 dark:bg-purple-600/15" />
        <div className="ambient-orb ambient-orb-3 bottom-20 left-10 h-96 w-96 bg-teal-400/15 dark:bg-teal-600/10" />
      </div>

      {/* Floating Apple Liquid Glass Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/65 backdrop-blur-3xl backdrop-saturate-[190%] transition-all duration-300 dark:border-white/[0.1] dark:bg-[rgba(20,22,28,0.7)] shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
          <button
            className="group flex items-center gap-2.5 text-base font-semibold tracking-tight transition-opacity hover:opacity-80"
            onClick={() => go(null)}
          >
            {/* Apple-style squircle emblem with specular sheen */}
            <span className="relative flex size-7 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 text-white shadow-[0_2px_10px_rgba(0,113,227,0.4)]">
              <span className="size-2 rounded-full bg-white animate-pulse" />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
            </span>
            <span className="text-foreground font-semibold">{me.site_name || "Monitor"}</span>
          </button>

          {demo && (
            <Badge variant="liquid" className="ml-1 cursor-pointer text-xs" onClick={exitDemo} title="点击退出演示模式">
              <Sparkles className="size-3 text-amber-500" />
              演示模式 · 点击退出
            </Badge>
          )}

          <div className="flex-1" />

          {open !== null && (
            <Button variant="glass" size="sm" onClick={() => go(null)} className="hidden sm:inline-flex gap-1.5">
              <ArrowLeft className="size-3.5" />
              返回节点列表
            </Button>
          )}

          <Button variant="ghost" size="sm" asChild>
            <a href="/admin/">
              <Wrench className="size-3.5" /> {me.authed ? "进入后台" : "登录"}
            </a>
          </Button>

          <Button variant="glass" size="icon" onClick={toggleTheme} title="切换外观主题">
            {dark ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-slate-700" />}
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto max-w-[1400px] space-y-5 px-4 py-5 sm:px-6">
        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive backdrop-blur-md">
            {error}
          </div>
        )}

        {open !== null ? (
          !nodes ? (
            <Skeleton className="h-96 rounded-2xl" />
          ) : selected ? (
            <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
              <div className="mb-2 sm:hidden">
                <Button variant="glass" size="sm" onClick={() => go(null)} className="gap-1.5">
                  <ArrowLeft className="size-3.5" />
                  返回节点列表
                </Button>
              </div>
              <NodeDetail node={selected} />
            </Suspense>
          ) : (
            <Card className="items-center justify-center py-16 text-center text-sm text-muted-foreground">
              <p>节点不存在或未公开。</p>
              <Button variant="link" onClick={() => go(null)} className="mt-2">
                返回列表
              </Button>
            </Card>
          )
        ) : !nodes ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            <Summary nodes={sorted} />
            {sorted.length === 0 ? (
              <Card className="items-center justify-center py-16 text-center text-sm text-muted-foreground">
                <p>还没有节点</p>
                {!demo && (
                  <Button variant="glass" size="sm" onClick={enableDemo} className="mt-3 gap-1.5">
                    <Sparkles className="size-3.5 text-amber-500" />
                    查看演示节点
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sorted.map((n: Node, idx: number) => (
                  <div
                    key={n.id}
                    className="animate-card-in"
                    style={{ animationDelay: `${Math.min(idx * 40, 500)}ms` }}
                  >
                    <NodeCard node={n} onOpen={() => go(n.id)} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
