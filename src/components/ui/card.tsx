import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.ComponentProps<"div"> {
  sheen?: boolean
  interactive?: boolean
  variant?: "default" | "translucent"
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, sheen = true, interactive = false, variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="card"
        className={cn(
          "liquid-card group relative flex flex-col gap-6 rounded-xl py-6 text-card-foreground transition-all duration-300",
          variant === "default" && [
            // 节点卡片：保留高模糊与经典毛玻璃质感，浅色模式下提供充足透光白底
            "border border-white/65 bg-white/45 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)]",
            "dark:border-white/[0.12] dark:bg-white/[0.06] dark:shadow-[0_4px_16px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.15)]",
            "hover:border-white/90 dark:hover:border-white/25",
          ],
          variant === "translucent" && [
            // 别的组件（例如Summary、图表等）：提升透明度同时增加浅色透光保护
            "border border-white/45 bg-white/25 backdrop-blur-md shadow-xs",
            "dark:border-white/[0.06] dark:bg-white/[0.015] dark:shadow-none",
            "hover:border-white/65 hover:bg-white/35 dark:hover:border-white/[0.1] dark:hover:bg-white/[0.035]",
          ],
          interactive && "cursor-pointer hover:-translate-y-1",
          className
        )}
        {...props}
      >
        {sheen && (
          <div
            className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(500px circle at 50% 0%, rgba(255, 255, 255, 0.15), transparent 70%)",
            }}
            aria-hidden="true"
          />
        )}
        <div className="relative z-10 flex h-full w-full flex-col gap-[inherit]">{children}</div>
      </div>
    )
  }
)
Card.displayName = "Card"

export { Card }

