import { cn } from '@/lib/utils'
import { Input, type InputProps } from './input'

type MoneyInputProps = Omit<InputProps, 'leading'> & {
  currency?: string
}

export function MoneyInput({ currency = 'R$', style, className, ...rest }: MoneyInputProps) {
  // "− R$" e "+ R$" não cabem no recuo padrão do ícone e encostavam no número.
  const wide = currency.length > 2
  return (
    <Input
      inputMode="decimal"
      leading={<span className="currency">{currency}</span>}
      className={cn(wide && 'with-leading-wide', className)}
      style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', ...style }}
      {...rest}
    />
  )
}
