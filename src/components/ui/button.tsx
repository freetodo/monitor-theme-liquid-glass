import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 outline-none select-none cursor-pointer active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600/85 hover:bg-blue-600 text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 border border-blue-400/30 backdrop-blur-md dark:bg-blue-600/85 dark:hover:bg-blue-600",
        active:
          "bg-blue-600/90 text-white font-semibold shadow-[0_2px_12px_rgba(37,99,235,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] border border-blue-400/40 backdrop-blur-md dark:bg-blue-500/90 dark:text-white dark:border-blue-300/40 dark:shadow-[0_2px_14px_rgba(59,130,246,0.4)]",
        glass:
          "bg-white/20 hover:bg-white/35 text-slate-900 border border-white/45 hover:border-white/75 shadow-xs backdrop-blur-md dark:bg-white/[0.06] dark:hover:bg-white/[0.14] dark:text-white dark:border-white/[0.1] dark:hover:border-white/[0.2]",
        liquid:
          "bg-white/20 hover:bg-white/35 text-slate-900 border border-white/45 hover:border-white/75 shadow-xs backdrop-blur-md dark:bg-white/[0.06] dark:hover:bg-white/[0.14] dark:text-white dark:border-white/[0.1] dark:hover:border-white/[0.2]",
        secondary:
          "bg-white/15 hover:bg-white/30 text-slate-900 border border-white/50 backdrop-blur-xl shadow-xs dark:bg-white/[0.06] dark:hover:bg-white/[0.14] dark:text-white dark:border-white/[0.12]",
        outline:
          "border border-white/60 hover:border-white/90 bg-white/10 hover:bg-white/25 text-slate-900 backdrop-blur-xl dark:border-white/[0.15] dark:hover:border-white/[0.25] dark:bg-white/[0.04] dark:hover:bg-white/[0.12] dark:text-white",
        ghost:
          "hover:bg-white/25 text-slate-900 dark:hover:bg-white/[0.1] dark:text-white",
        destructive:
          "bg-red-500/85 hover:bg-red-500 text-white shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/35 border border-red-400/30 backdrop-blur-md",
        link:
          "text-blue-600 hover:underline dark:text-blue-400 font-normal p-0 h-auto rounded-none",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6.5 gap-1 px-2.5 text-[11px] has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3.5 text-xs has-[>svg]:px-2.5",
        lg: "h-10.5 gap-2 px-5 text-sm has-[>svg]:px-4",
        icon: "size-8 rounded-full p-0 [&_svg:not([class*='size-'])]:size-4",
        "icon-xs": "size-6.5 rounded-full p-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7.5 rounded-full p-0",
        "icon-lg": "size-10 rounded-full p-0",
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
  children,
  ref,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      ref={ref}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      <Slot.Slottable>{children}</Slot.Slottable>
    </Comp>
  )
}

export { Button, buttonVariants }
