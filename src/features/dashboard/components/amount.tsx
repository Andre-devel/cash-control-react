import { useHideValues } from '@/features/dashboard/hooks/use-hide-values'
import { HIDDEN_MONEY } from '@/features/dashboard/utils'

interface AmountProps {
  value: number
  /** Sinal explícito `+`/`−` (U+2212). Sem ele, só negativos levam `−`. */
  signed?: boolean
  className?: string
}

/** Valor em reais que respeita "Ocultar valores". */
export function Amount({ value, signed = false, className = '' }: AmountProps) {
  const { hidden } = useHideValues()

  if (hidden) {
    return (
      <span className={`whitespace-nowrap tabular-nums ${className}`}>
        <span aria-hidden="true">{HIDDEN_MONEY}</span>
        <span className="sr-only">Valor oculto</span>
      </span>
    )
  }

  const abs = Math.abs(value)
  const [intStr, decStr] = abs.toFixed(2).split('.')
  const grouped = (intStr ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const sign = signed ? (value > 0 ? '+' : value < 0 ? '−' : '') : value < 0 ? '−' : ''

  return (
    <span className={`whitespace-nowrap tabular-nums ${className}`}>
      {sign}
      <span className="mr-[0.2em] text-[0.72em] font-semibold opacity-70">R$</span>
      {grouped}
      <span className="text-[0.72em] opacity-70">,{decStr ?? '00'}</span>
    </span>
  )
}
