import type { CSSProperties, ReactNode } from 'react'

export type BadgeKind =
  | 'paid'
  | 'pending'
  | 'overdue'
  | 'cancelled'
  | 'income'
  | 'expense'
  | 'info'
  | 'muted'

interface BadgeProps {
  children: ReactNode
  kind?: BadgeKind
  dot?: boolean
  /** Ícone no lugar do ponto — status nunca deve depender só da cor. */
  icon?: ReactNode
  square?: boolean
  style?: CSSProperties
}

export function Badge({
  children,
  kind = 'muted',
  dot = true,
  icon,
  square = false,
  style,
}: BadgeProps) {
  return (
    <span className={`badge ${kind}${square ? ' square' : ''}`} style={style}>
      {icon ?? (dot && <span className="dot" />)}
      {children}
    </span>
  )
}
