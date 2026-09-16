import { useEffect, useMemo, useState } from "react"
import { median } from "d3-array"
import {
  Area, AreaChart, Brush, CartesianGrid, ComposedChart, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Country, Status } from "@/components/NodeCard"
import { api, type Node } from "@/lib/api"
import {
  axisBytes, axisTop, bytes, clockFor, quarters, cpuName, CYCLES, FOREVER, money, osName, rate, timeTicks,
} from "@/lib/format"
import { cn } from "@/lib/utils"

type Point = {
  ts: number
  cpu: number
  mem_used: number
  disk_used: number
  net_rx: number
  net_tx: number
}

type PingPoint = {
  task_id: number
  ts: number
  latency: number | null
  band?: [number, number]
  loss?: number
}

type Probes = Record<string, string>
type Loss = Record<string, number>

const RANGES = [
  { hours: 1, label: "1 小时" },
  { hours: 6, label: "6 小时" },
  { hours: 24, label: "24 小时" },
  { hours: 168, label: "7 天" },
]

const RANGES_FOR = { resources: RANGES, latency: RANGES.filter((r) => r.hours <= 24) }

const AXIS = { stroke: "currentColor", fontSize: 11, tickLine: false, axisLine: false }

const SERIES = { dot: false as const, strokeWidth: 2, isAnimationActive: false }

const Y_WIDTH = 68

// Apple Vibrant palette for multi-probe latency comparison
const PALETTE = [
  { stroke: "#007aff", dash: undefined }, // Apple Blue
  { stroke: "#af52de", dash: undefined }, // Apple Purple
  { stroke: "#00c7be", dash: undefined }, // Apple Teal
  { stroke: "#ff9500", dash: undefined }, // Apple Orange
  { stroke: "#ff2d55", dash: undefined }, // Apple Coral
  { stroke: "#34c759", dash: undefined }, // Apple Green
  { stroke: "#5856d6", dash: undefined }, // Apple Indigo
]

const TABS = [
  { key: "resources", label: "系统资源" },
  { key: "latency", label: "网络延迟" },
] as const

const tooltipStyle = {
  borderRadius: "16px",
  border: "1px solid var(--liquid-glass-border)",
  backgroundColor: "var(--liquid-glass-bg)",
  backdropFilter: "blur(28px) saturate(190%)",
  WebkitBackdropFilter: "blur(28px) saturate(190%)",
  boxShadow: "0 12px 36px rgba(0,0,0,0.12), inset 0 1px 1px rgba(255,255,255,0.7)",
  fontSize: 12,
  color: "var(--color-foreground)",
  padding: "10px 14px",
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card sheen className="gap-2 p-4.5 transition-all duration-300 ease-spring">
      <h4 className="text-xs font-semibold tracking-tight text-muted-foreground">{title}</h4>
      <div className="h-44 w-full">{children}</div>
    </Card>
  )
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 outline-none select-none cursor-pointer active:scale-[0.96]",
        active
          ? "bg-blue-600/85 text-white font-semibold shadow-[0_2px_12px_rgba(37,99,235,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] border border-blue-400/40 backdrop-blur-md dark:bg-blue-500/85 dark:text-white dark:border-blue-300/40 dark:shadow-[0_2px_14px_rgba(59,130,246,0.4)]"
          : "text-white/85 hover:text-white hover:bg-white/30 dark:text-white/85 dark:hover:text-white dark:hover:bg-white/[0.16]"
      )}
    >
      {children}
    </button>
  )
}

function despike(points: PingPoint[], window = 7, sigmas = 3): PingPoint[] {
  const half = window >> 1
  return points.map((p, i) => {
    if (p.latency === null) return p
    const near = points
      .slice(Math.max(0, i - half), i + half + 1)
      .map((x) => x.latency)
      .filter((v) => v !== null)
    const mid = median(near) ?? p.latency
    const mad = median(near.map((v) => Math.abs(v - mid))) ?? 0
    const outlier = mad > 0 && Math.abs(p.latency - mid) > sigmas * 1.4826 * mad
    return outlier ? { ...p, latency: mid } : p
  })
}

function Fact({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null
  return (
    <div className="rounded-xl border border-white/60 bg-white/10 p-3 backdrop-blur-xl shadow-[0_2px_10px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:border-white/[0.1] dark:bg-white/[0.05] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all hover:border-white/90 dark:hover:border-white/20">
      <dt className="text-[11px] font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-semibold tracking-tight text-foreground">{value}</dd>
    </div>
  )
}

export function NodeDetail({ node }: { node: Node }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>(() => {
    const p = new URLSearchParams(location.search).get("tab")
    return p === "latency" ? "latency" : "resources"
  })
  const [ranges, setRanges] = useState({ resources: 6, latency: 6 })
  const hours = ranges[tab]
  const [smooth, setSmooth] = useState(false)
  const [hiddenProbes, setHiddenProbes] = useState<number[]>([])
  const [data, setData] = useState<{ metrics: Point[]; ping: PingPoint[]; probes: Probes; loss?: Loss } | null>(null)
  const [failed, setFailed] = useState("")
  const [zoom, setZoom] = useState<[number, number] | null>(null)
  const [chartTop, setChartTop] = useState(0)

  useEffect(() => {
    let active = true
    // oxlint-disable-next-line react/set-state-in-effect
    setData(null)
    // oxlint-disable-next-line react/set-state-in-effect
    setZoom(null)
    // oxlint-disable-next-line react/set-state-in-effect
    setFailed("")

    const points = Math.round(globalThis.innerWidth * (globalThis.devicePixelRatio || 1))
    const series = tab === "latency" ? "ping" : "metrics"
    api<{ metrics: Point[]; ping: PingPoint[]; probes: Probes; loss?: Loss }>(
      `/nodes/${node.id}/metrics?hours=${hours}&points=${points}&series=${series}`,
    )
      .then((next) => { if (active) setData(next) })
      .catch((e: Error) => {
        if (active) { setFailed(e.message || "网络错误"); setData({ metrics: [], ping: [], probes: {} }) }
      })
    return () => { active = false }
  }, [node.id, hours, tab])

  const m = node.metrics
  const pingSeries = useMemo(
    () =>
      [...new Set((data?.ping ?? []).map((p) => p.task_id))]
        .map((id) => {
          const points = (data?.ping ?? []).filter((p) => p.task_id === id)
          const loss = data?.loss?.[id] ?? 0
          return { id, name: data?.probes?.[id] ?? `探测 ${id}`, points, loss }
        })
        .filter((s) => s.points.length > 0),
    [data],
  )

  const metricRows = useMemo(
    () => (data?.metrics ?? []).map((m) => ({ ...m, ts: m.ts * 1_000 })),
    [data],
  )

  const tops = useMemo(() => {
    const max = (pick: (m: Point) => number) =>
      metricRows.reduce((hi, m) => Math.max(hi, pick(m)), 0)
    return {
      cpu: axisTop(max((m) => m.cpu), 4, 10, 100),
      rate: axisTop(max((m) => Math.max(m.net_rx, m.net_tx)), 1024, 1024),
    }
  }, [metricRows])

  const shownProbes = useMemo(
    () => pingSeries.filter((s) => !hiddenProbes.includes(s.id)),
    [pingSeries, hiddenProbes],
  )

  const style = (id: number) => PALETTE[pingSeries.findIndex((p) => p.id === id) % PALETTE.length]

  const pingRows = useMemo(() => {
    const rows = new Map<
      number,
      { ts: number } & Record<string, number | [number, number] | null>
    >()
    for (const s of pingSeries) {
      const smoothed = despike(s.points)
      s.points.forEach((p, i) => {
        const row = rows.get(p.ts) ?? { ts: p.ts * 1_000 }
        row[`t${s.id}`] = p.latency
        row[`s${s.id}`] = smoothed[i].latency
        row[`l${s.id}`] = p.loss ?? 0
        row[`b${s.id}`] = p.band ?? null
        rows.set(p.ts, row)
      })
    }
    return [...rows.values()].sort((a, b) => a.ts - b.ts)
  }, [pingSeries])

  const timeAxis = (rows: { ts: number }[], from = 0, to = rows.length - 1) => ({
    dataKey: "ts",
    type: "number" as const,
    domain: ["dataMin", "dataMax"] as const,
    ticks: rows.length ? timeTicks(rows[from].ts, rows[to].ts) : undefined,
    tickFormatter: clockFor(hours),
    minTickGap: hours > 24 ? 72 : 40,
    ...AXIS,
  })

  return (
    <div className="space-y-4">
      {/* Node Title & Status Bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <h2 className="truncate text-xl font-bold tracking-tight text-foreground">{node.name}</h2>
        <Country node={node} />
        <Status node={node} />
        {node.agent_version && (
          <Badge variant="glass" className="font-normal">
            agent {node.agent_version}
          </Badge>
        )}
      </div>

      {/* Facts Card Grid */}
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Fact label="操作系统" value={[osName(node.os), node.kernel].filter(Boolean).join(" · ")} />
        <Fact
          label="处理器"
          value={node.cpu_name ? `${cpuName(node.cpu_name)} × ${node.cpu_cores}` : `${node.cpu_cores} 核`}
        />
        <Fact label="内存 / 存储" value={`${bytes(node.mem_total)} / ${bytes(node.disk_total)}`} />
        <Fact
          label="架构与虚拟化"
          value={[node.arch, node.virt !== "none" ? node.virt : "", m ? `${m.procs} 进程` : ""]
            .filter(Boolean)
            .join(" · ")}
        />
        <Fact label="今日流量" value={`↓ ${bytes(node.day_rx)} · ↑ ${bytes(node.day_tx)}`} />
        <Fact
          label="续费周期"
          value={[
            node.price > 0
              ? `${money(node.price, node.currency)} / ${CYCLES[node.billing_cycle] ?? node.billing_cycle}`
              : "免费",
            node.expires_at ? `${node.expires_at} 到期` : FOREVER,
          ].join(" · ")}
        />
      </dl>

      {node.remark && (
        <div className="rounded-xl border border-white/60 bg-white/10 px-4 py-3 text-sm backdrop-blur-xl shadow-[0_2px_10px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:border-white/[0.1] dark:bg-white/[0.05] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all hover:border-white/90 dark:hover:border-white/20 whitespace-pre-wrap">
          {node.remark}
        </div>
      )}

      {/* Segmented Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.05] dark:border-white/[0.08] pt-4">
        {/* Apple Segmented Control for Mode Tabs */}
        <div className="inline-flex rounded-full bg-white/20 p-1 backdrop-blur-2xl dark:bg-black/30 border border-white/60 dark:border-white/15 shadow-[0_2px_10px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
          {TABS.map((t) => (
            <Tab key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
            </Tab>
          ))}
        </div>

        {/* Apple Segmented Control for Time Ranges & Smoothing Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-full bg-white/20 p-1 backdrop-blur-2xl dark:bg-black/30 border border-white/60 dark:border-white/15 shadow-[0_2px_10px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
            {RANGES_FOR[tab].map((r) => (
              <Tab
                key={r.hours}
                active={hours === r.hours}
                onClick={() => setRanges((all) => ({ ...all, [tab]: r.hours }))}
              >
                {r.label}
              </Tab>
            ))}
          </div>

          {tab === "latency" && (
            <button
              type="button"
              onClick={() => setSmooth(!smooth)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 outline-none select-none cursor-pointer active:scale-[0.96] border shadow-[0_2px_8px_rgba(0,0,0,0.03)] backdrop-blur-2xl",
                smooth
                  ? "bg-blue-600/85 text-white font-semibold border-blue-400/40 shadow-[0_2px_12px_rgba(37,99,235,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] dark:bg-blue-500/85 dark:text-white dark:border-blue-300/40 dark:shadow-[0_2px_14px_rgba(59,130,246,0.4)]"
                  : "bg-white/20 text-white border-white/60 hover:bg-white/35 hover:text-white dark:bg-black/30 dark:text-white dark:border-white/15 dark:hover:bg-black/50 dark:hover:text-white"
              )}
            >
              <span
                className={cn(
                  "size-2 rounded-full transition-all",
                  smooth ? "bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)]" : "bg-slate-400 dark:bg-white/40"
                )}
              />
              削峰平滑
            </button>
          )}
        </div>
      </div>

      {!data ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : failed ? (
        <p className="py-8 text-center text-sm text-destructive" role="alert">读取历史数据失败：{failed}</p>
      ) : tab === "latency" ? (
        pingSeries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">这段时间没有延迟数据</p>
        ) : (
          <Card
            ref={(el) => {
              if (el) setChartTop(el.getBoundingClientRect().top + scrollY)
            }}
            style={
              chartTop
                ? { height: `calc(100svh - ${Math.round(chartTop)}px - 1.5rem)` }
                : undefined
            }
            className="flex min-h-80 flex-col gap-3 p-4.5"
          >
            <div className="min-h-0 w-full flex-1 text-muted-foreground">
              {shownProbes.length === 0 ? (
                <p className="py-8 text-center text-sm">没有选中任何探测</p>
              ) : (
                <ResponsiveContainer>
                  <ComposedChart data={pingRows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 120, 130, 0.15)" vertical={false} />
                    <XAxis
                      {...timeAxis(
                        pingRows,
                        Math.min(zoom?.[0] ?? 0, pingRows.length - 1),
                        Math.min(zoom?.[1] ?? pingRows.length - 1, pingRows.length - 1),
                      )}
                    />
                    <YAxis unit="ms" width={52} domain={["auto", "auto"]} {...AXIS} />
                    <Tooltip
                      labelFormatter={(ts) => new Date(Number(ts)).toLocaleString("zh-CN")}
                      formatter={(v, name, item) => {
                        const loss = Number(item?.payload?.[`l${String(item.dataKey).slice(1)}`] ?? 0)
                        return [`${Number(v)} ms${loss > 0 ? ` · 丢 ${loss}%` : ""}`, name]
                      }}
                      contentStyle={tooltipStyle}
                    />
                    {shownProbes.length === 1 &&
                      shownProbes.map((s) => (
                        <Area
                          key={`band${s.id}`}
                          dataKey={`b${s.id}`}
                          stroke="none"
                          fill={style(s.id).stroke}
                          fillOpacity={0.16}
                          isAnimationActive={false}
                          tooltipType="none"
                          legendType="none"
                          connectNulls
                        />
                      ))}
                    {shownProbes.map((s) => (
                      <Line
                        key={s.id}
                        dataKey={`${smooth ? "s" : "t"}${s.id}`}
                        name={s.name}
                        stroke={style(s.id).stroke}
                        strokeDasharray={style(s.id).dash}
                        {...SERIES}
                        connectNulls
                      />
                    ))}
                    <Brush
                      dataKey="ts"
                      height={24}
                      travellerWidth={8}
                      tickFormatter={clockFor(hours)}
                      className="fill-black/[0.04] dark:fill-white/[0.08]"
                      stroke="var(--color-primary)"
                      onChange={(r) => setZoom([r.startIndex ?? 0, r.endIndex ?? pingRows.length - 1])}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            {(pingSeries.length > 1 || pingSeries.some((s) => s.loss > 0)) && (
              <div className="flex flex-wrap items-center justify-center gap-2 border-t border-black/[0.05] dark:border-white/[0.08] pt-3">
                {pingSeries.map((s) => {
                  const shown = !hiddenProbes.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      onClick={() =>
                        setHiddenProbes((h) => (shown ? [...h, s.id] : h.filter((id) => id !== s.id)))
                      }
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium backdrop-blur-2xl transition-all duration-200 cursor-pointer select-none active:scale-[0.96]",
                        shown
                          ? "border-white/60 bg-white/20 text-white shadow-[0_2px_8px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.8)] hover:bg-white/35 hover:border-white/90 dark:border-white/[0.18] dark:bg-white/[0.08] dark:text-white dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] dark:hover:bg-white/[0.16]"
                          : "border-black/[0.06] bg-black/[0.03] text-white/50 opacity-60 hover:opacity-90 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/50",
                      )}
                    >
                      <span
                        className={cn("size-2 rounded-full transition-all", shown && "shadow-[0_0_6px_currentColor]")}
                        style={{ backgroundColor: style(s.id).stroke, color: style(s.id).stroke }}
                        aria-hidden
                      />
                      <span className={cn(!shown && "line-through opacity-75")}>{s.name}</span>
                      {s.loss > 0 && (
                        <span className="tnum text-destructive">
                          丢 {s.loss < 1 ? "<1" : Math.round(s.loss)}%
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </Card>
        )
      ) : data.metrics.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">这段时间没有历史数据</p>
      ) : (
        <div className="space-y-4">
          <Panel title="CPU 使用率">
            <ResponsiveContainer>
              <AreaChart data={metricRows}>
                <defs>
                  <linearGradient id="cpu-glow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#007aff" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#007aff" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 120, 130, 0.15)" vertical={false} />
                <XAxis {...timeAxis(metricRows)} />
                <YAxis domain={[0, tops.cpu]} ticks={quarters(tops.cpu)} unit="%" width={Y_WIDTH} {...AXIS} />
                <Tooltip
                  labelFormatter={(ts) => new Date(Number(ts)).toLocaleString("zh-CN")}
                  formatter={(v) => [`${Number(v).toFixed(1)}%`, "CPU"]}
                  contentStyle={tooltipStyle}
                />
                <Area dataKey="cpu" stroke="#007aff" fill="url(#cpu-glow)" {...SERIES} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title={`内存使用 · ${bytes(node.mem_total)}`}>
            <ResponsiveContainer>
              <AreaChart data={metricRows}>
                <defs>
                  <linearGradient id="mem-glow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#af52de" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#af52de" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 120, 130, 0.15)" vertical={false} />
                <XAxis {...timeAxis(metricRows)} />
                <YAxis domain={[0, node.mem_total]} ticks={quarters(node.mem_total)} tickFormatter={axisBytes} width={Y_WIDTH} {...AXIS} />
                <Tooltip
                  labelFormatter={(ts) => new Date(Number(ts)).toLocaleString("zh-CN")}
                  formatter={(v) => bytes(Number(v))}
                  contentStyle={tooltipStyle}
                />
                <Area dataKey="mem_used" name="内存" stroke="#af52de" fill="url(#mem-glow)" {...SERIES} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="实时网络速率">
            <ResponsiveContainer>
              <LineChart data={metricRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 120, 130, 0.15)" vertical={false} />
                <XAxis {...timeAxis(metricRows)} />
                <YAxis domain={[0, tops.rate]} ticks={quarters(tops.rate)} tickFormatter={axisBytes} unit="/s" width={Y_WIDTH} {...AXIS} />
                <Tooltip
                  labelFormatter={(ts) => new Date(Number(ts)).toLocaleString("zh-CN")}
                  formatter={(v) => rate(Number(v))}
                  contentStyle={tooltipStyle}
                />
                <Line dataKey="net_rx" name="下行" stroke="#007aff" {...SERIES} />
                <Line dataKey="net_tx" name="上行" stroke="#af52de" {...SERIES} />
              </LineChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title={`存储占用 · ${bytes(node.disk_total)}`}>
            <ResponsiveContainer>
              <AreaChart data={metricRows}>
                <defs>
                  <linearGradient id="disk-glow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00c7be" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#00c7be" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 120, 130, 0.15)" vertical={false} />
                <XAxis {...timeAxis(metricRows)} />
                <YAxis domain={[0, node.disk_total]} ticks={quarters(node.disk_total)} tickFormatter={axisBytes} width={Y_WIDTH} {...AXIS} />
                <Tooltip
                  labelFormatter={(ts) => new Date(Number(ts)).toLocaleString("zh-CN")}
                  formatter={(v) => bytes(Number(v))}
                  contentStyle={tooltipStyle}
                />
                <Area dataKey="disk_used" name="硬盘" stroke="#00c7be" fill="url(#disk-glow)" {...SERIES} />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      )}
    </div>
  )
}
