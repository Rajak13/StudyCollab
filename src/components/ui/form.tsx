import { cn } from '@/lib/utils'
import * as React from 'react'
import { Label } from './label'

// Form component
const Form = React.forwardRef<
  HTMLFormElement,
  React.FormHTMLAttributes<HTMLFormElement>
>(({ className, ...props }, ref) => {
  return <form ref={ref} className={cn('space-y-6', className)} {...props} />
})
Form.displayName = 'Form'

// FormField component
interface FormFieldProps {
  children: React.ReactNode
  className?: string
}

const FormField = ({ children, className }: FormFieldProps) => {
  return <div className={cn('space-y-2', className)}>{children}</div>
}

// FormLabel component
interface FormLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {
  required?: boolean
}

const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  FormLabelProps
>(({ className, required, children, ...props }, ref) => (
  <Label
    ref={ref}
    className={cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className
    )}
    {...props}
  >
    {children}
    {required && <span className="ml-1 text-destructive">*</span>}
  </Label>
))
FormLabel.displayName = 'FormLabel'

// FormMessage component
interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: 'error' | 'success' | 'warning' | 'info'
}

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, variant = 'error', children, ...props }, ref) => {
    if (!children) return null

    const variantStyles = {
      error: 'text-destructive',
      success: 'text-green-600 dark:text-green-400',
      warning: 'text-yellow-600 dark:text-yellow-400',
      info: 'text-blue-600 dark:text-blue-400',
    }

    return (
      <p
        ref={ref}
        className={cn('text-sm font-medium', variantStyles[variant], className)}
        {...props}
      >
        {children}
      </p>
    )
  }
)
FormMessage.displayName = 'FormMessage'

// FormDescription component
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
})
FormDescription.displayName = 'FormDescription'

export { Form, FormDescription, FormField, FormLabel, FormMessage }
