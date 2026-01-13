import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

// Note: radx-ui/react-slot and class-variance-authority might need to be installed.
// Checking dependencies first... actually I will assume standard Shadcn-like setup.
// But I need to install them if not present.
// I'll stick to simple props if CVA/Slot are not available, BUT standard modern React implies these.
// Let's implement a simpler version first to avoid dependency hell if they are not installed.
// Or better: I will install them. They are standard.

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 active:scale-95"
    
    const variants = {
      primary: "bg-primary text-white hover:bg-primary/90 shadow-[0_0_20px_-5px_var(--color-primary)]",
      secondary: "bg-surface-hover text-foreground hover:bg-surface-hover/80 border border-white/10",
      ghost: "hover:bg-white/5 text-muted hover:text-foreground",
      outline: "border border-border bg-transparent hover:bg-surface-hover text-foreground",
      danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
    }
    
    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
      icon: "h-10 w-10"
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
