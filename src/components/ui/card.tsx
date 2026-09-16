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
          "liquid-card group relative flex flex-col gap-6 rounded-[28px] py-6 text-card-foreground transition-all duration-300",
          interactive && "cursor-pointer hover:-translate-y-1 hover:shadow-xl",
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

