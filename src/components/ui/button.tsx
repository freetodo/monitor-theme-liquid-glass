import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ease-spring outline-none active:scale-[0.95] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-blue-500 to-blue-600 text-primary-foreground shadow-[0_3px_12px_rgba(0,113,227,0.35),inset_0_1px_0_rgba(255,255,255,0.35)] hover:brightness-105 active:brightness-95",
        destructive:
          "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_3px_12px_rgba(255,59,48,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] hover:brightness-105 active:brightness-95",
        outline:
          "border border-black/[0.08] bg-white/40 shadow-xs backdrop-blur-md hover:bg-white/80 hover:text-foreground dark:border-white/[0.12] dark:bg-white/[0.06] dark:hover:bg-white/[0.12]",
        secondary:
          "bg-black/[0.05] text-secondary-foreground backdrop-blur-md hover:bg-black/[0.08] dark:bg-white/[0.08] dark:hover:bg-white/[0.14]",
        ghost:
          "hover:bg-black/[0.05] hover:text-foreground dark:hover:bg-white/[0.1]",
        glass:
          "border border-white/75 bg-white/60 text-foreground shadow-[0_4px_16px_rgba(0,0,0,0.04),inset_0_1.5px_1px_rgba(255,255,255,0.95)] backdrop-blur-2xl backdrop-saturate-[190%] hover:bg-white/80 hover:border-white/95 hover:shadow-[0_6px_20px_rgba(0,0,0,0.08),inset_0_1.5px_1px_rgba(255,255,255,1)] dark:border-white/[0.16] dark:bg-white/[0.08] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1.5px_1px_rgba(255,255,255,0.2)] dark:hover:bg-white/[0.14] dark:hover:border-white/25",
        liquid:
          "border border-white/80 bg-white/50 text-foreground shadow-[0_4px_20px_rgba(0,0,0,0.05),inset_0_1.5px_1px_rgba(255,255,255,1)] backdrop-blur-2xl backdrop-saturate-[200%] hover:bg-white/70 hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)] dark:border-white/[0.18] dark:bg-white/[0.1] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.25)] dark:hover:bg-white/[0.16]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-lg px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-lg px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-xl px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-full",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-full",
        "icon-lg": "size-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
