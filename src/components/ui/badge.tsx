import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-all duration-200 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-xs [a&]:hover:opacity-90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground backdrop-blur-md [a&]:hover:opacity-90",
        destructive:
          "border-destructive/20 bg-destructive/15 text-destructive backdrop-blur-md [a&]:hover:bg-destructive/25",
        outline:
          "border-black/[0.08] bg-black/[0.02] text-foreground backdrop-blur-md dark:border-white/[0.12] dark:bg-white/[0.06] [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        glass:
          "border-white/70 bg-white/60 text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-xl backdrop-saturate-[180%] dark:border-white/[0.15] dark:bg-white/[0.08] dark:shadow-[0_2px_10px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.18)]",
        liquid:
          "border-white/80 bg-white/50 text-foreground shadow-[0_2px_12px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-2xl backdrop-saturate-[200%] dark:border-white/[0.18] dark:bg-white/[0.12] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.22)]",
        success:
          "border-emerald-500/25 bg-emerald-500/15 text-emerald-400 backdrop-blur-xl shadow-[0_2px_8px_rgba(16,185,129,0.15),inset_0_1px_0.5px_rgba(255,255,255,0.6)] dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/25",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
