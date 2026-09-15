import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type Props = {
  label: ReactNode
  pct: number | null
  foot: ReactNode
  empty?: ReactNode
  type?: "cpu" | "mem" | "disk" | "traffic"
}

function getGradient(type?: Props["type"], pct?: number | null) {
  if (pct === null || pct === undefined) return "bg-foreground"

  if (type === "cpu" || !type) {
    if (pct >= 85) return "bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
    if (pct >= 70) return "bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
    return "bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400"
  }

  switch (type) {
    case "mem":
      return pct >= 85
        ? "bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
        : "bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-purple-400 dark:to-indigo-400"
    case "disk":
      return pct >= 90
        ? "bg-gradient-to-r from-orange-500 to-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
        : "bg-gradient-to-r from-teal-500 to-cyan-500 dark:from-teal-400 dark:to-cyan-400"
    case "traffic":
      return "bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400"
  }
}

/**
 * Apple Glass Metric capsule: name and percentage on top,
 * sleek rounded pill track in the middle with subtle inner groove,
 * vibrant gradient fill and contextual glowing status.
 */
export function Meter({ label, pct, foot, empty = "—", type }: Props) {
  const filled = pct === null ? 0 : Math.min(100, Math.max(0, pct))
  const gradientClass = getGradient(type, pct)

  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
        <span className="tnum text-xs font-semibold text-foreground">
          {pct === null ? empty : `${filled < 10 ? filled.toFixed(1) : filled.toFixed(0)}%`}
        </span>
      </div>

      {/* Apple liquid capsule groove */}
      <div className="relative mt-1.5 h-2 w-full overflow-hidden rounded-full border border-black/[0.04] bg-black/[0.05] p-[0.5px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_1px_0_rgba(255,255,255,0.6)] dark:border-white/[0.08] dark:bg-black/40 dark:shadow-[inset_0_1.5px_2.5px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.1)]">
        <div
          className={cn(
            "relative h-full rounded-full transition-[width] duration-500 ease-spring",
            gradientClass
          )}
          style={{ width: `${filled}%` }}
        >
          {/* Subtle liquid surface highlight */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[50%] rounded-t-full bg-white/30" />
        </div>
      </div>

      <div className="tnum mt-1.5 truncate text-[11px] text-muted-foreground">{foot}</div>
    </div>
  )
}
