import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        // Primary Color: #006AFF | Hover: #99C4FF
        default: "bg-[#006AFF] text-white hover:bg-[#99C4FF] font-medium",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline: "border border-slate-200 bg-white text-slate-900 hover:bg-[#99C4FF] hover:text-white font-medium",
        // Secondary/Icon Buttons: White | Hover: #99C4FF
        secondary: "bg-white border border-slate-200 text-slate-900 hover:bg-[#99C4FF] hover:text-white font-medium shadow-sm",
        ghost: "hover:bg-slate-100 hover:text-[#006AFF]",
        link: "text-[#006AFF] underline-offset-4 hover:underline font-medium",
      },
      size: {
        // Standardized height for all buttons to ensure Upload and View Doc match
        default: "h-10 px-4 py-2", 
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-6",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
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
  const Comp = asChild ? Slot : "button"

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