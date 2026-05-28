import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'

export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'ghost'
  | 'danger'
  | 'outline'
  | 'destructive'
  | 'secondary'
  | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'default'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
  leading?: React.ReactNode
  trailing?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      asChild = false,
      leading,
      trailing,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button'

    const cls = ['btn']
    if (variant === 'primary') cls.push('btn-primary')
    if (variant === 'ghost' || variant === 'link') cls.push('btn-ghost')
    if (variant === 'danger' || variant === 'destructive') cls.push('btn-danger')
    if (size === 'sm') cls.push('btn-sm')
    if (size === 'lg') cls.push('btn-lg')
    if (size === 'icon') cls.push('btn-icon')
    if (className) cls.push(className)

    return (
      <Comp className={cls.join(' ')} ref={ref} {...props}>
        {asChild ? (
          children
        ) : (
          <>
            {leading}
            {children}
            {trailing}
          </>
        )}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { Button }
