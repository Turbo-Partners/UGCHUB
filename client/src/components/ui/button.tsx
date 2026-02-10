import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer touch-target touch-feedback hover-elevate active-elevate-2",
  {
    variants: {
      variant: {
        default:
           // Primary button with glow effect in both modes
           "bg-primary text-primary-foreground border [border-color:hsl(var(--primary-border))] shadow-[0_0_15px_rgba(79,70,229,0.15)] hover:shadow-[0_0_25px_rgba(79,70,229,0.25)] dark:shadow-[0_0_20px_rgba(99,102,241,0.3)] dark:hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm border [border-color:hsl(var(--destructive-border))] shadow-[0_0_10px_rgba(239,68,68,0.1)] dark:shadow-[0_0_15px_rgba(239,68,68,0.2)]",
        outline:
          // Enhanced outline with subtle hover effects
          "border [border-color:hsl(var(--button-outline))] shadow-xs active:shadow-none hover:border-primary/30 hover:shadow-[0_0_10px_rgba(79,70,229,0.05)] dark:hover:border-primary/40 dark:hover:shadow-[0_0_15px_rgba(99,102,241,0.1)]",
        secondary:
          // Secondary with subtle hover
          "bg-secondary text-secondary-foreground border [border-color:hsl(var(--secondary-border))] hover:bg-secondary/90 dark:hover:bg-secondary/80",
        // Ghost with hover highlight
        ghost: "border border-transparent hover:bg-muted/50 dark:hover:bg-white/5",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // @replit changed sizes
        default: "min-h-9 px-4 py-2",
        sm: "min-h-8 rounded-md px-3 text-xs",
        lg: "min-h-10 rounded-md px-8",
        icon: "h-9 w-9",
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
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
