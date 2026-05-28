import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leading?: React.ReactNode
  trailing?: React.ReactNode
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leading, trailing, error, ...props }, ref) => {
    if (!leading && !trailing) {
      return (
        <input
          type={type}
          className={cn('input', error && 'error', className)}
          ref={ref}
          {...props}
        />
      )
    }
    return (
      <div className="input-group">
        {leading && <span className="leading">{leading}</span>}
        <input
          type={type}
          className={cn(
            'input',
            error && 'error',
            leading && 'with-leading',
            trailing && 'with-trailing',
            className,
          )}
          ref={ref}
          {...props}
        />
        {trailing}
      </div>
    )
  },
)
Input.displayName = 'Input'

export { Input }
