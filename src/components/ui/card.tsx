import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.ComponentProps<"div"> {
  sheen?: boolean
  interactive?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, sheen = true, interactive = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="card"
        className={cn(
          "liquid-card group relative flex flex-col gap-6 rounded-xl py-6 text-card-foreground transition-all duration-300",
          "border border-white/60 bg-white/10 backdrop-blur-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.8)]",
          "dark:border-white/[0.1] dark:bg-white/[0.05] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.15)]",
          "hover:border-white/90 dark:hover:border-white/20",
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

