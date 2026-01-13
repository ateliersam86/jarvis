import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, id, ...props }, ref) => {
    // Generate random ID if not provided for label association
    const generatedId = React.useId()
    const inputId = id || generatedId

    return (
      <div className="relative">
        <input
          type={type}
          id={inputId}
          className={cn(
            "peer block w-full rounded-lg border border-border bg-surface/50 px-4 pb-2.5 pt-5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50",
            className
          )}
          placeholder=" " // Required for peer-placeholder-shown to work
          ref={ref}
          {...props}
        />
        {label && (
          <label
            htmlFor={inputId}
            className="absolute left-4 top-4 z-10 origin-[0] -translate-y-2.5 scale-75 transform text-sm text-muted duration-150 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2.5 peer-focus:scale-75 peer-focus:text-primary"
          >
            {label}
          </label>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
