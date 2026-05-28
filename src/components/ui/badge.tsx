import type { CSSProperties, ReactNode } from 'react'

export type BadgeKind = 'paid' | 'pending' | 'cancelled' | 'income' | 'expense' | 'info' | 'muted'

interface BadgeProps {
  children: ReactNode
  kind?: BadgeKind
  dot?: boolean
  square?: boolean
  style?: CSSProperties
}

export function Badge({ children, kind = 'muted', dot = true, square = false, style }: BadgeProps) {
  return (
    <span className={`badge ${kind}${square ? ' square' : ''}`} style={style}>
      {dot && <span className="dot" />}
      {children}
    </span>
  )
}
