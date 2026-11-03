import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatYearMonth } from '@/lib/format-date'

interface MonthPickerProps {
  /** Meses selecionáveis (`aaaa-mm`), do mais antigo ao atual. */
  options: string[]
  value: string
  onChange: (month: string) => void
  /** Rótulo do grupo para leitor de tela. */
  label?: string
}

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'

/** ‹ out/2026 ›. */
export function MonthStepper({
  options,
  value,
  onChange,
  label = 'Mês do resumo',
  className = '',
}: MonthPickerProps & { className?: string }) {
  const index = options.indexOf(value)
  const prev = index > 0 ? options[index - 1] : undefined
  const next = index >= 0 && index < options.length - 1 ? options[index + 1] : undefined

  return (
    <div
      role="group"
      aria-label={label}
      className={`flex items-center rounded-lg border border-border bg-surface-1 ${className}`}
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
