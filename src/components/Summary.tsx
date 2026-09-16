import { Activity, ArrowDown, ArrowDownUp, ArrowUp, Gauge, Server } from "lucide-react"

import { Card } from "@/components/ui/card"
import { speedHistory, type Node } from "@/lib/api"
import { bytes, rate } from "@/lib/format"
import { cn } from "@/lib/utils"

function Tile({
  icon: Icon,
  label,
  colorClass,
  children,
}: {
  icon: typeof Server
  label: string
  colorClass: { bg: string; text: string }
  children: React.ReactNode
}) {
  return (
    <Card
      sheen
      className="group gap-0 p-4.5 transition-all duration-300 ease-spring backdrop-blur-2xl hover:translate-y-[-2px] hover:shadow-[0_8px_20px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:hover:shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.25)]"
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <div
          className={cn(
            "flex size-7 items-center justify-center rounded-xl border border-white/60 dark:border-white/10 shadow-[0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.7)] backdrop-blur-md transition-transform duration-300 ease-spring group-hover:scale-110",
            colorClass.bg,
            colorClass.text
          )}
        >
          <Icon className="size-3.5" />
        </div>
        <span>{label}</span>
      </div>
      {children}
    </Card>
  )
}

/**
 * In and out side by side, the form every traffic figure on this page takes.
 */
function Flow({ down, up, className }: { down: string; up: string; className?: string }) {
  return (
    <div className={cn("tnum grid grid-cols-1 gap-x-2 sm:grid-cols-2", className)}>
      <span className="inline-flex items-center gap-1">
        <ArrowDown className="size-3 shrink-0 text-blue-500 dark:text-blue-400" />
        {down}
      </span>
      <span className="inline-flex items-center gap-1">
        <ArrowUp className="size-3 shrink-0 text-purple-500 dark:text-purple-400" />
        {up}
      </span>
    </div>
  )
}

/**
 * Apple-style Sparkline with smooth gradient fills and vibrant strokes.
 */
function Spark({ series }: { series: { values: number[]; stroke: string; gradientId: string; fill: string }[] }) {
  const top = Math.max(...series.flatMap((s) => s.values), 1)
  const width = Math.max(...series.map((s) => s.values.length), 2) - 1

  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="h-7 w-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id="spark-rx" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#007aff" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#007aff" stopOpacity="0.0" />
        </linearGradient>
        <linearGradient id="spark-tx" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#af52de" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#af52de" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {series.map((s, i) => {
        const points = s.values.map((v, x) => `${(x / width) * 100},${23 - (v / top) * 22}`).join(" ")
        const closedArea = `${points} 100,24 0,24`
        return (
          <g key={i}>
            <polygon points={closedArea} fill={s.fill} />
            <polyline
              className={s.stroke}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              points={points}
            />
          </g>
        )
      })}
    </svg>
  )
}

export function Summary({ nodes }: { nodes: Node[] }) {
  const online = nodes.filter((n) => n.online)
  const sum = (pick: (n: Node) => number) => nodes.reduce((total, n) => total + pick(n), 0)

  const busiest = online.reduce<Node | null>(
    (top, n) => (n.metrics && (!top || n.metrics.cpu > top.metrics!.cpu) ? n : top),
    null,
  )
  const cpu = busiest?.metrics?.cpu ?? 0
  const now = speedHistory.at(-1) ?? { rx: 0, tx: 0 }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile
        icon={Server}
        label="节点数量"
        colorClass={{
          bg: "bg-blue-500/15 dark:bg-blue-500/25",
          text: "text-blue-600 dark:text-blue-400",
        }}
      >
        <div className="tnum mt-2 text-2xl font-semibold tracking-tight">
          {online.length} <span className="text-sm font-normal text-muted-foreground">/ {nodes.length}</span>
        </div>
        <div className="mt-auto pt-1 text-xs text-muted-foreground">
          {nodes.length - online.length > 0 ? (
            <span className="text-amber-600 dark:text-amber-400">{nodes.length - online.length} 个离线</span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400">全部在线</span>
          )}
        </div>
      </Tile>

      <Tile
        icon={Activity}
        label="最忙节点"
        colorClass={{
          bg: "bg-amber-500/15 dark:bg-amber-500/25",
          text: "text-amber-600 dark:text-amber-400",
        }}
      >
        <div className="tnum mt-2 text-2xl font-semibold tracking-tight">
          {busiest ? `${cpu.toFixed(1)}%` : "—"}
        </div>
        <div
          className={cn(
            "mt-auto truncate pt-1 text-xs",
            cpu >= 85 ? "font-semibold text-rose-500" : "text-muted-foreground",
          )}
        >
          {busiest ? busiest.name : "无在线节点"}
        </div>
      </Tile>

      <Tile
        icon={ArrowDownUp}
        label="今日流量"
        colorClass={{
          bg: "bg-purple-500/15 dark:bg-purple-500/25",
          text: "text-purple-600 dark:text-purple-400",
        }}
      >
        <Flow
          down={bytes(sum((n) => n.day_rx))}
          up={bytes(sum((n) => n.day_tx))}
          className="mt-2 text-sm font-semibold"
        />
        <div className="mt-2 text-[11px] font-medium text-muted-foreground">总流量累计</div>
        <Flow down={bytes(sum((n) => n.total_rx))} up={bytes(sum((n) => n.total_tx))} className="mt-0.5 text-xs" />
      </Tile>

      <Tile
        icon={Gauge}
        label="实时网速"
        colorClass={{
          bg: "bg-emerald-500/15 dark:bg-emerald-500/25",
          text: "text-emerald-600 dark:text-emerald-400",
        }}
      >
        <Flow down={rate(now.rx)} up={rate(now.tx)} className="mt-2 text-sm font-semibold" />
        <div className="mt-auto pt-1">
          <Spark
            series={[
              {
                values: speedHistory.map((s) => s.rx),
                stroke: "text-blue-500 dark:text-blue-400",
                gradientId: "spark-rx",
                fill: "url(#spark-rx)",
              },
              {
                values: speedHistory.map((s) => s.tx),
                stroke: "text-purple-500 dark:text-purple-400",
                gradientId: "spark-tx",
                fill: "url(#spark-tx)",
              },
            ]}
          />
        </div>
      </Tile>
    </div>
  )
}
