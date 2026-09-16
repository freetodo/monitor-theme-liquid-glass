import { Activity, ArrowDown, ArrowDownUp, ArrowUp, Gauge, Server } from "lucide-react"

import { Card } from "@/components/ui/card"
import type { Node, SpeedPoint } from "@/lib/api"
import { bytes, rate } from "@/lib/format"
import { cn } from "@/lib/utils"

function Tile({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Server
  label: string
  children: React.ReactNode
}) {
  return (
    <Card
      variant="translucent"
      sheen={false}
      className="summary-card group gap-0 p-4.5 transition-all duration-300 ease-spring hover:translate-y-[-2px] !bg-transparent !shadow-none hover:!bg-transparent hover:!shadow-none dark:!bg-transparent dark:!shadow-none dark:hover:!bg-transparent dark:hover:!shadow-none"
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-white/90">
        <div className="flex size-7 items-center justify-center rounded-xl border border-white/50 dark:border-white/15 bg-white/30 dark:bg-white/[0.08] text-foreground dark:text-white shadow-xs backdrop-blur-sm transition-transform duration-300 ease-spring group-hover:scale-110">
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
      <span className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400">
        <ArrowDown className="size-3 shrink-0 text-sky-500 dark:text-sky-400" />
        {down}
      </span>
      <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-white/90">
        <ArrowUp className="size-3 shrink-0 text-slate-600 dark:text-white/70" />
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
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
        </linearGradient>
        <linearGradient id="spark-tx" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
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

export function Summary({ nodes, speedHistory }: { nodes: Node[]; speedHistory: SpeedPoint[] }) {
  const online = nodes.filter((n) => n.online)
  const sum = (pick: (n: Node) => number) => nodes.reduce((total, n) => total + pick(n), 0)

  const busiest = online.reduce<Node | null>(
    (top, n) => (n.metrics && (!top || n.metrics.cpu > top.metrics!.cpu) ? n : top),
    null,
  )
  const cpu = busiest?.metrics?.cpu ?? 0
  const now = speedHistory.at(-1) ?? { rx: 0, tx: 0 }

  return (
    <div className="summary-cards grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile icon={Server} label="节点数量">
        <div className="tnum mt-2 text-2xl font-bold tracking-tight text-foreground">
          {online.length} <span className="text-sm font-semibold text-slate-600 dark:text-white/80">/ {nodes.length}</span>
        </div>
        <div className="mt-auto pt-1 text-xs font-medium">
          {nodes.length - online.length > 0 ? (
            <span className="font-semibold text-amber-600 dark:text-amber-400">{nodes.length - online.length} 个离线</span>
          ) : (
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">全部在线</span>
          )}
        </div>
      </Tile>

      <Tile icon={Activity} label="最忙节点">
        <div className="tnum mt-2 text-2xl font-bold tracking-tight text-foreground">
          {busiest ? `${cpu.toFixed(1)}%` : "—"}
        </div>
        <div
          className={cn(
            "mt-auto truncate pt-1 text-xs font-semibold",
            cpu >= 85 ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-white/85",
          )}
        >
          {busiest ? busiest.name : "无在线节点"}
        </div>
      </Tile>

      <Tile icon={ArrowDownUp} label="今日流量">
        <Flow
          down={bytes(sum((n) => n.day_rx))}
          up={bytes(sum((n) => n.day_tx))}
          className="mt-2 text-sm font-semibold"
        />
        <div className="mt-2 text-[11px] font-semibold text-slate-700 dark:text-white/80">总流量累计</div>
        <Flow down={bytes(sum((n) => n.total_rx))} up={bytes(sum((n) => n.total_tx))} className="mt-0.5 text-xs font-medium" />
      </Tile>

      <Tile icon={Gauge} label="实时网速">
        <Flow down={rate(now.rx)} up={rate(now.tx)} className="mt-2 text-sm font-semibold" />
        <div className="mt-auto pt-1">
          <Spark
            series={[
              {
                values: speedHistory.map((s) => s.rx),
                stroke: "text-sky-400",
                gradientId: "spark-rx",
                fill: "url(#spark-rx)",
              },
              {
                values: speedHistory.map((s) => s.tx),
                stroke: "text-slate-400 dark:text-white/60",
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
