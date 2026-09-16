import { Activity, ArrowDown, ArrowDownUp, ArrowUp, ChevronRight, Gauge, Server } from "lucide-react"

import { speedHistory, type Node } from "@/lib/api"
import { bytes, rate } from "@/lib/format"
import { cn } from "@/lib/utils"

function Tile({
  icon: Icon,
  label,
  children,
  onClick,
  className,
}: {
  icon: typeof Server
  label: string
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl p-4 transition-all duration-300 ease-spring select-none",
        // 全透明背景，完全透出壁纸与背景动画
        "bg-transparent border border-black/[0.08] dark:border-white/[0.1]",
        "hover:border-black/25 hover:bg-black/[0.025] dark:hover:border-white/25 dark:hover:bg-white/[0.025]",
        "hover:translate-y-[-2px] hover:shadow-xs",
        onClick && "cursor-pointer active:scale-[0.98]",
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <div className="flex size-6 items-center justify-center rounded-lg border border-black/[0.08] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] text-foreground shadow-2xs backdrop-blur-xs transition-transform duration-300 ease-spring group-hover:scale-110">
          <Icon className="size-3 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
        <span className="font-medium tracking-tight text-muted-foreground">{label}</span>
      </div>
      {children}
    </div>
  )
}

/**
 * In and out side by side, the form traffic figures take.
 */
function Flow({ down, up, className }: { down: string; up: string; className?: string }) {
  return (
    <div className={cn("tnum grid grid-cols-1 gap-x-2 sm:grid-cols-2", className)}>
      <span className="inline-flex items-center gap-1">
        <ArrowDown className="size-3 shrink-0 text-sky-500 dark:text-sky-400" />
        <span className="truncate">{down}</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <ArrowUp className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span className="truncate">{up}</span>
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
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
        </linearGradient>
        <linearGradient id="spark-tx" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
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

export function Summary({
  nodes,
  onSelectNode,
}: {
  nodes: Node[]
  onSelectNode?: (id: number) => void
}) {
  const online = nodes.filter((n) => n.online)
  const sum = (pick: (n: Node) => number) => nodes.reduce((total, n) => total + pick(n), 0)

  const busiest = online.reduce<Node | null>(
    (top, n) => (n.metrics && (!top || n.metrics.cpu > top.metrics!.cpu) ? n : top),
    null,
  )
  const cpu = busiest?.metrics?.cpu ?? 0
  const now = speedHistory.at(-1) ?? { rx: 0, tx: 0 }
  const totalNodes = nodes.length
  const onlineCount = online.length
  const offlineCount = totalNodes - onlineCount
  const onlinePct = totalNodes > 0 ? Math.round((onlineCount / totalNodes) * 100) : 0

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {/* 节点总览 */}
      <Tile icon={Server} label="集群状态">
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="tnum text-2xl font-bold tracking-tight text-foreground">{onlineCount}</span>
          <span className="text-xs font-normal text-muted-foreground">/ {totalNodes} 在线</span>
        </div>

        {/* 节点健康度微进度条 */}
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              totalNodes === 0
                ? "w-0"
                : onlineCount === totalNodes
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
            )}
            style={{ width: `${onlinePct}%` }}
          />
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
          {offlineCount > 0 ? (
            <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
              {offlineCount} 台离线
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              全部运行正常
            </span>
          )}
          <span className="text-[10px] text-muted-foreground/80">{onlinePct}%</span>
        </div>
      </Tile>

      {/* 最忙节点（可点击直达节点详情） */}
      <Tile
        icon={Activity}
        label="最忙节点"
        onClick={() => busiest && onSelectNode?.(busiest.id)}
        className={busiest && onSelectNode ? "cursor-pointer" : undefined}
      >
        <div className="mt-2 flex items-baseline gap-1.5">
          <span
            className={cn(
              "tnum text-2xl font-bold tracking-tight",
              cpu >= 85 ? "text-rose-500 dark:text-rose-400" : "text-foreground"
            )}
          >
            {busiest ? `${cpu.toFixed(1)}%` : "—"}
          </span>
          <span className="text-xs font-normal text-muted-foreground">CPU 负载</span>
        </div>

        {/* CPU 负载微指示条 */}
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              cpu >= 85
                ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                : cpu >= 60
                  ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                  : "bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]"
            )}
            style={{ width: `${Math.min(cpu, 100)}%` }}
          />
        </div>

        <div className="mt-1.5 flex items-center justify-between text-xs">
          <span
            className={cn(
              "truncate font-medium",
              cpu >= 85 ? "text-rose-500 dark:text-rose-400 font-semibold" : "text-muted-foreground"
            )}
          >
            {busiest ? busiest.name : "无在线节点"}
          </span>
          {busiest && onSelectNode && (
            <span className="shrink-0 text-[10px] text-primary opacity-0 transition-opacity group-hover:opacity-100 flex items-center gap-0.5">
              查看 <ChevronRight className="size-3" />
            </span>
          )}
        </div>
      </Tile>

      {/* 今日流量 */}
      <Tile icon={ArrowDownUp} label="今日流量">
        <Flow
          down={bytes(sum((n) => n.day_rx))}
          up={bytes(sum((n) => n.day_tx))}
          className="mt-2 text-sm font-semibold"
        />

        {/* 累计总流量 */}
        <div className="mt-2 border-t border-black/[0.05] dark:border-white/[0.06] pt-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>总累计</span>
            <span className="tnum flex items-center gap-2">
              <span className="text-sky-600/90 dark:text-sky-400/90">↓ {bytes(sum((n) => n.total_rx))}</span>
              <span className="text-emerald-600/90 dark:text-emerald-400/90">↑ {bytes(sum((n) => n.total_tx))}</span>
            </span>
          </div>
        </div>
      </Tile>

      {/* 实时网速 */}
      <Tile icon={Gauge} label="实时网速">
        <Flow down={rate(now.rx)} up={rate(now.tx)} className="mt-2 text-sm font-semibold" />
        <div className="mt-auto pt-1">
          <Spark
            series={[
              {
                values: speedHistory.map((s) => s.rx),
                stroke: "text-sky-500 dark:text-sky-400",
                gradientId: "spark-rx",
                fill: "url(#spark-rx)",
              },
              {
                values: speedHistory.map((s) => s.tx),
                stroke: "text-emerald-500 dark:text-emerald-400",
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
