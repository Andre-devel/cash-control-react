import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatYearMonth } from '@/lib/format-date'
import { monthPillLabel } from '@/features/dashboard/utils'

interface MonthPickerProps {
  /** Meses selecionáveis (`aaaa-mm`), do mais antigo ao atual. */
  options: string[]
  value: string
  onChange: (month: string) => void
}

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'

/** Celular: pills roláveis, o mês atual à direita já visível. */
export function MonthPills({ options, value, onChange }: MonthPickerProps) {
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  return (
    <div
      ref={scroller}
      role="group"
      aria-label="Mês do resumo"
      className="-mx-4 flex snap-x gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
    >
      {options.map((m) => {
        const on = m === value
        return (
          <button
            key={m}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(m)}
            className={`min-h-touch min-w-[60px] flex-1 snap-end rounded-lg border text-caption font-semibold ${FOCUS} ${
              on ? 'border-brand bg-brand text-brand-ink' : 'border-border text-fg-muted'
            }`}
          >
            {monthPillLabel(m)}
          </button>
        )
      })}
    </div>
  )
}

/** Tablet e desktop: ‹ out/2026 ›. */
export function MonthStepper({ options, value, onChange }: MonthPickerProps) {
  const index = options.indexOf(value)
  const prev = index > 0 ? options[index - 1] : undefined
  const next = index >= 0 && index < options.length - 1 ? options[index + 1] : undefined

  return (
    <div
      role="group"
      aria-label="Mês do resumo"
      className="flex items-center rounded-lg border border-border bg-surface-1"
    >
      <button
        type="button"
        aria-label="Mês anterior"
        disabled={!prev}
        onClick={() => prev && onChange(prev)}
        className={`flex h-11 w-11 items-center justify-center rounded-lg text-fg disabled:opacity-40 ${FOCUS}`}
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <span className="min-w-[84px] text-center text-body-sm font-semibold" aria-live="polite">
        {formatYearMonth(value)}
      </span>
      <button
        type="button"
        aria-label="Próximo mês"
        disabled={!next}
        onClick={() => next && onChange(next)}
        className={`flex h-11 w-11 items-center justify-center rounded-lg text-fg disabled:opacity-40 ${FOCUS}`}
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </div>
  )
}
