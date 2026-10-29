import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export type StatusTone = 'pending' | 'info' | 'overdue'

const TONE: Record<StatusTone, { bubble: string; code: string }> = {
  pending: { bubble: 'bg-pending-soft text-pending', code: 'text-pending/40' },
  info: { bubble: 'bg-info/15 text-info', code: 'text-info/40' },
  overdue: { bubble: 'bg-overdue-soft text-overdue', code: 'text-overdue/40' },
}

interface StatusPageProps {
  code: string
  icon: LucideIcon
  tone: StatusTone
  title: string
  description: ReactNode
  /** Conteúdo entre o texto e as ações (ex.: código de correlação). */
  extra?: ReactNode
  actions: ReactNode
  /** `fullscreen` para rotas fora do shell (404, erro na raiz). */
  fullscreen?: boolean
  role?: 'alert'
}

/** Página de estado (403 · 404 · erro inesperado) centralizada, com código e ações. */
export function StatusPage({
  code,
  icon: Icon,
  tone,
  title,
  description,
  extra,
  actions,
  fullscreen = false,
  role,
}: StatusPageProps) {
  const t = TONE[tone]
  return (
    <div
      role={role}
      className={`flex items-center justify-center bg-bg px-4 py-12 text-fg ${
        fullscreen ? 'min-h-[100dvh]' : 'min-h-[70dvh]'
      }`}
    >
      <div className="flex w-full max-w-[400px] flex-col items-center gap-3 text-center">
        {/* O código é o h1 (rótulo curto e estável); o título descritivo vem logo abaixo. */}
        <h1
          className={`m-0 font-mono text-[3.5rem] font-bold leading-none tracking-[-0.04em] ${t.code}`}
        >
          {code}
        </h1>
        <span
          className={`grid h-16 w-16 place-items-center rounded-2xl ${t.bubble}`}
          aria-hidden="true"
        >
          <Icon size={28} />
        </span>
        <h2 className="m-0 mt-1 font-display text-h1 [text-wrap:balance]">{title}</h2>
        <p className="m-0 max-w-[340px] text-[0.9375rem] leading-[1.5] text-fg-muted">
          {description}
        </p>
        {extra}
        <div className="mt-3 flex w-full flex-col gap-2.5">{actions}</div>
      </div>
    </div>
  )
}
