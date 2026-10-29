import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export type AuthStatusTone = 'info' | 'paid' | 'overdue' | 'pending' | 'brand'

const TONE: Record<AuthStatusTone, string> = {
  info: 'bg-info/15 text-info',
  paid: 'bg-paid-soft text-paid',
  overdue: 'bg-overdue-soft text-overdue',
  pending: 'bg-pending-soft text-pending',
  brand: 'bg-brand-soft text-brand-text',
}

interface AuthStatusProps {
  icon: LucideIcon
  tone: AuthStatusTone
  title: string
  children?: ReactNode
  /** Estado em andamento: gira o ícone e marca aria-busy. */
  busy?: boolean
}

/** Estado centralizado (verificação de e-mail, callback do Google, link inválido). */
export function AuthStatus({ icon: Icon, tone, title, children, busy }: AuthStatusProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-center" aria-busy={busy || undefined}>
      <span className={`grid h-[4.5rem] w-[4.5rem] place-items-center rounded-2xl ${TONE[tone]}`}>
        <Icon
          size={32}
          aria-hidden="true"
          className={busy ? 'animate-spin motion-reduce:animate-none' : undefined}
        />
      </span>
      <h1 className="m-0 mt-2 font-display text-[1.625rem] font-extrabold leading-[1.15] [text-wrap:balance]">
        {title}
      </h1>
      {children}
    </div>
  )
}

export function AuthStatusText({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 max-w-[340px] text-[0.9375rem] leading-[1.5] text-fg-muted">{children}</p>
  )
}
