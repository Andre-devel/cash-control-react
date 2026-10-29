import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface PanelProps {
  children: ReactNode
  className?: string
  /** Rótulo da região para leitores de tela. */
  label?: string
}

/** Card da dashboard: superfície 1, borda e raio grande do design. */
export function Panel({ children, className = '', label }: PanelProps) {
  return (
    <section
      aria-label={label}
      className={`flex min-w-0 flex-col rounded-2xl border border-border bg-surface-1 p-4 md:p-5 ${className}`}
    >
      {children}
    </section>
  )
}

interface PanelHeaderProps {
  title: ReactNode
  sub?: ReactNode
  right?: ReactNode
}

export function PanelHeader({ title, sub, right }: PanelHeaderProps) {
  return (
    <div className="mb-3 flex min-h-touch flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <div className="min-w-0">
        <h2 className="font-display text-h2 text-fg">{title}</h2>
        {sub && <p className="mt-1 text-caption text-fg-muted">{sub}</p>}
      </div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  )
}

interface WidgetErrorProps {
  message: string
  onRetry?: () => void
}

export function WidgetError({ message, onRetry }: WidgetErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-start gap-2 py-4">
      <p className="text-body-sm text-expense">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  )
}

export function WidgetEmpty({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-body-sm text-fg-muted">{children}</p>
}

/** Bloco de esqueleto; sem brilho com `prefers-reduced-motion`. */
export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`rounded-md bg-surface-3 motion-safe:animate-pulse ${className}`} />
}

/** Período personalizado dos gráficos, recolhido para não pesar no celular. */
export function RangeDetails({ children }: { children: ReactNode }) {
  return (
    <details className="mb-3 text-body-sm">
      <summary className="inline-flex min-h-touch cursor-pointer items-center rounded-md font-semibold text-brand-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus">
        Personalizar período
      </summary>
      <div className="mt-2 flex flex-wrap items-center gap-2">{children}</div>
    </details>
  )
}
