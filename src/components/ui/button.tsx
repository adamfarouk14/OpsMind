import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // base
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // solid blue — primary action
        default:
          "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",

        // subtle destructive
        destructive:
          "bg-red-500 text-white hover:bg-red-600 active:bg-red-700",

        // bordered, light bg
        outline:
          "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100",

        // muted fill
        secondary:
          "bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300",

        // no background
        ghost:
          "text-slate-600 hover:bg-slate-100 hover:text-slate-800",

        // text-only link style
        link:
          "text-blue-600 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm:      "h-7 rounded-md px-2.5 text-[12px]",
        lg:      "h-10 px-6 text-[14px]",
        icon:    "h-9 w-9 p-0",
        "icon-sm": "h-7 w-7 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
)
Button.displayName = "Button"

export { Button, buttonVariants }
