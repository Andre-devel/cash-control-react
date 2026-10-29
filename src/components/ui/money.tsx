import { useHideValues } from '@/lib/hide-values'

const CURRENCY_SYMBOLS: Record<string, string> = {
  BRL: 'R$',
  USD: 'US$',
  EUR: '€',
}

interface MoneyProps {
  value: number
  currency?: string
  signed?: boolean
  muted?: boolean
  className?: string
}

export function Money({
  value,
  currency = 'BRL',
  signed = false,
  muted = false,
  className = '',
}: MoneyProps) {
  const { hidden } = useHideValues()
  const isNegative = value < 0
  const abs = Math.abs(value)
  const [int, dec] = abs.toFixed(2).split('.')
  const intGrouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const sym = CURRENCY_SYMBOLS[currency] ?? currency

  let displaySign = ''
  if (signed) {
    displaySign = value > 0 ? '+' : value < 0 ? '−' : ''
  } else if (isNegative) {
    displaySign = '-'
  }

  const symbol = (
    <span
      style={{
        color: muted ? 'var(--text-faint)' : 'inherit',
        marginRight: 4,
        fontSize: '0.78em',
      }}
    >
      {sym}
    </span>
  )

  if (hidden) {
    return (
      <span className={`num ${className}`}>
        {symbol}
        <span aria-hidden="true">••••</span>
        <span className="sr-only">Valor oculto</span>
      </span>
    )
  }

  return (
    <span className={`num ${className}`}>
      {displaySign && <span style={{ marginRight: 2 }}>{displaySign}</span>}
      {symbol}
      {intGrouped}
      <span style={{ color: 'var(--text-dim)' }}>,{dec}</span>
    </span>
  )
}
