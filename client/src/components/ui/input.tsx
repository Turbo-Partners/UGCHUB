import * as React from "react"
import { CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  error?: string;
  success?: boolean;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, hint, leftIcon, rightIcon, ...props }, ref) => {
    const hasError = !!error;
    const hasSuccess = success && !hasError;
    
    return (
      <div className="relative w-full">
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-base shadow-sm transition-all duration-300",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "md:text-sm",
              leftIcon && "pl-10",
              (rightIcon || hasError || hasSuccess) && "pr-10",
              hasError 
                ? "border-destructive/50 focus-visible:ring-destructive/20 focus-visible:border-destructive/60 focus-visible:shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                : hasSuccess
                  ? "border-green-500/50 focus-visible:ring-green-500/20 focus-visible:border-green-500/60 focus-visible:shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                  : "border-input focus-visible:ring-primary/20 focus-visible:border-primary/40 focus-visible:shadow-[0_0_15px_rgba(79,70,229,0.08)]",
              "dark:bg-card/50 dark:backdrop-blur-sm",
              !hasError && !hasSuccess && "dark:focus-visible:ring-primary/30 dark:focus-visible:border-primary/50 dark:focus-visible:shadow-[0_0_20px_rgba(99,102,241,0.15)]",
              className
            )}
            ref={ref}
            {...props}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {hasError && <XCircle className="h-4 w-4 text-destructive animate-in fade-in duration-200" />}
            {hasSuccess && <CheckCircle2 className="h-4 w-4 text-green-500 animate-in fade-in duration-200" />}
            {!hasError && !hasSuccess && rightIcon}
          </div>
        </div>
        {(error || hint) && (
          <p className={cn(
            "text-xs mt-1.5 animate-in slide-in-from-top-1 duration-200",
            hasError ? "text-destructive" : "text-muted-foreground"
          )}>
            {error || hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, required, children, className }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        <label className="text-sm font-medium text-foreground flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </label>
        {children}
      </div>
    )
  }
)
FormField.displayName = "FormField"

export { Input, FormField }
