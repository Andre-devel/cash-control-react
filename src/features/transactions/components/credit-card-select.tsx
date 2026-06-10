import type { Card } from '@/features/cards/types'
import { Select } from '@/components/ui/select'

interface CreditCardSelectProps {
  value: string
  onChange: (value: string) => void
  cards: Card[]
  name?: string
  'aria-label'?: string
}

export function CreditCardSelect({
  value,
  onChange,
  cards,
  name,
  'aria-label': ariaLabel,
}: CreditCardSelectProps) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      name={name}
      aria-label={ariaLabel}
    >
      {cards.length === 0 ? (
        <option value="" disabled>
          Nenhum cartão cadastrado
        </option>
      ) : (
        <>
          <option value="" />
          {cards.map((card) => (
            <option key={card.id} value={card.id}>
              {card.name} ({card.brand})
            </option>
          ))}
        </>
      )}
    </Select>
  )
}
