import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { Loader2 } from 'lucide-react'

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
  /** Mantém a largura, mostra spinner, marca `aria-busy` e bloqueia o clique. */
  loading?: boolean
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
      loading = false,
      children,
      disabled,
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
      <Comp
        className={cls.join(' ')}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : leading}
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
