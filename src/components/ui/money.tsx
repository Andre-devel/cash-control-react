const CURRENCY_SYMBOLS: Record<string, string> = {
  BRL: 'R$',
  USD: '$',
}

interface MoneyProps {
  value: number
  currency?: 'BRL' | 'USD'
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

  return (
    <span className={`mono ${className}`}>
      <span
        style={{
          color: muted ? 'var(--text-faint)' : 'inherit',
          marginRight: 4,
          fontSize: '0.78em',
        }}
      >
        {sym}
      </span>
      {displaySign}
      {intGrouped}
      <span style={{ color: 'var(--text-dim)' }}>,{dec}</span>
    </span>
  )
}
