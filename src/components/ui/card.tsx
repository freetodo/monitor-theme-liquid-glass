import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.ComponentProps<"div"> {
  sheen?: boolean
  interactive?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      sheen = true,
      interactive = false,
      style,
      onMouseMove,
      onMouseLeave,
      children,
      ...props
    },
    ref
  ) => {
    const localRef = React.useRef<HTMLDivElement>(null)
    React.useImperativeHandle(ref, () => localRef.current!)

    const [coords, setCoords] = React.useState<{ x: number; y: number; active: boolean }>({
      x: 50,
      y: 50,
      active: false,
    })

    const handleMouseMove = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (localRef.current) {
          const rect = localRef.current.getBoundingClientRect()
          const x = ((e.clientX - rect.left) / rect.width) * 100
          const y = ((e.clientY - rect.top) / rect.height) * 100
          setCoords({ x, y, active: true })
        }
        onMouseMove?.(e)
      },
      [onMouseMove]
    )

    const handleMouseLeave = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        setCoords((prev) => ({ ...prev, active: false }))
        onMouseLeave?.(e)
      },
      [onMouseLeave]
    )

    const tiltX = coords.active ? ((coords.x - 50) * 0.1).toFixed(2) : "0"
    const tiltY = coords.active ? ((coords.y - 50) * -0.1).toFixed(2) : "0"

    return (
      <div
        ref={localRef}
        data-slot="card"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "group relative flex flex-col gap-6 overflow-hidden rounded-2xl py-6 text-card-foreground",
          "border border-white/80 bg-white/45 backdrop-blur-2xl backdrop-saturate-[210%]",
          "shadow-[0_16px_40px_-6px_rgba(0,0,0,0.08),0_4px_16px_-2px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(255,255,255,0.45),inset_0_2px_2px_rgba(255,255,255,0.95)]",
          "dark:border-white/[0.16] dark:bg-[rgba(18,22,32,0.52)]",
          "dark:shadow-[0_20px_50px_-6px_rgba(0,0,0,0.55),0_4px_20px_-2px_rgba(0,0,0,0.35),inset_0_0_0_1px_rgba(255,255,255,0.12),inset_0_2px_2px_rgba(255,255,255,0.25)]",
          interactive && "cursor-pointer hover:border-white hover:shadow-[0_24px_52px_-8px_rgba(0,0,0,0.14)] dark:hover:border-white/30 dark:hover:shadow-[0_24px_60px_-8px_rgba(0,0,0,0.7)] active:scale-[0.98]",
          className
        )}
        style={{
          transform: interactive && coords.active
            ? `perspective(1000px) rotateX(${tiltY}deg) rotateY(${tiltX}deg) translate3d(0, -6px, 0)`
            : "perspective(1000px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)",
          transition: coords.active
            ? "transform 0.12s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.25s ease, border-color 0.25s ease"
            : "transform 0.6s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.4s ease, border-color 0.3s ease",
          ...style,
        }}
        {...props}
      >
        {/* Apple Liquid Glass Dynamic Prismatic Rim Reflection */}
        <div
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-80 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `linear-gradient(
              ${135 + Number(tiltX) * 4}deg,
              rgba(255, 255, 255, 0.7) 0%,
              rgba(255, 255, 255, 0.1) 40%,
              rgba(255, 255, 255, 0.0) 60%,
              rgba(255, 255, 255, 0.4) 100%
            )`,
            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            padding: "1px",
          }}
          aria-hidden="true"
        />

        {/* Dynamic Refractive Liquid Sheen on Hover */}
        {sheen && (
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-400 group-hover:opacity-100"
            style={{
              background: `radial-gradient(400px circle at ${coords.x}% ${coords.y}%, rgba(255, 255, 255, 0.28), transparent 65%)`,
            }}
            aria-hidden="true"
          />
        )}

        {/* Top Rim Specular Highlight */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 dark:via-white/40"
          aria-hidden="true"
        />

        {/* Card Content */}
        <div className="relative z-20 flex flex-col gap-inherit w-full h-full">{children}</div>
      </div>
    )
  }
)

Card.displayName = "Card"

export { Card }
