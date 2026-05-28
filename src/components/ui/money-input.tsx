import { Input, type InputProps } from './input'

type MoneyInputProps = Omit<InputProps, 'leading'> & {
  currency?: string
}

export function MoneyInput({ currency = 'R$', style, ...rest }: MoneyInputProps) {
  return (
    <Input
      inputMode="decimal"
      leading={<span className="currency">{currency}</span>}
      style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', ...style }}
      {...rest}
    />
  )
}
