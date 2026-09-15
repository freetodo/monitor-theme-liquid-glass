import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.ComponentProps<"div"> {
  sheen?: boolean
  interactive?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, sheen = true, interactive = false, onMouseMove, onMouseLeave, children, ...props }, ref) => {
    const localRef = React.useRef<HTMLDivElement>(null)
    React.useImperativeHandle(ref, () => localRef.current!)

    const [coords, setCoords] = React.useState<{ x: number; y: number; active: boolean }>({
      x: 50,
      y: 50,
      active: false,
    })

    const handleMouseMove = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (sheen && localRef.current) {
          const rect = localRef.current.getBoundingClientRect()
          const x = ((e.clientX - rect.left) / rect.width) * 100
          const y = ((e.clientY - rect.top) / rect.height) * 100
          setCoords({ x, y, active: true })
        }
        onMouseMove?.(e)
      },
      [sheen, onMouseMove]
    )

    const handleMouseLeave = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (sheen) {
          setCoords((prev) => ({ ...prev, active: false }))
        }
        onMouseLeave?.(e)
      },
      [sheen, onMouseLeave]
    )

    return (
      <div
        ref={localRef}
        data-slot="card"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "group relative flex flex-col gap-6 overflow-hidden rounded-2xl py-6 text-card-foreground",
          "border border-white/70 bg-white/65 backdrop-blur-2xl backdrop-saturate-[190%]",
          "shadow-[0_10px_36px_-4px_rgba(0,0,0,0.06),0_2px_8px_-1px_rgba(0,0,0,0.03),inset_0_1.5px_1px_rgba(255,255,255,0.95)]",
          "dark:border-white/[0.14] dark:bg-[rgba(26,29,36,0.65)]",
          "dark:shadow-[0_14px_40px_-4px_rgba(0,0,0,0.45),0_2px_10px_-1px_rgba(0,0,0,0.25),inset_0_1.5px_1px_rgba(255,255,255,0.18)]",
          "transition-all duration-300 ease-spring",
          interactive && "cursor-pointer hover:border-white/95 dark:hover:border-white/28",
          className
        )}
        {...props}
      >
        {/* Dynamic Refractive Liquid Sheen on Hover */}
        {sheen && (
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background: `radial-gradient(420px circle at ${coords.x}% ${coords.y}%, rgba(255, 255, 255, 0.22), transparent 60%)`,
            }}
            aria-hidden="true"
          />
        )}

        {/* Top Rim Prismatic Light Highlight */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/30"
          aria-hidden="true"
        />

        {/* Card Content */}
        <div className="relative z-10 flex flex-col gap-inherit w-full h-full">{children}</div>
      </div>
    )
  }
)

Card.displayName = "Card"

export { Card }
