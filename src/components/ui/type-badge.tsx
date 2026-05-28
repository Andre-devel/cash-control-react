import { Badge } from './badge'

const TYPE_MAP = {
  INCOME: { kind: 'income' as const, label: 'Receita' },
  EXPENSE: { kind: 'expense' as const, label: 'Despesa' },
  TRANSFER: { kind: 'info' as const, label: 'Transferência' },
  REFUND: { kind: 'info' as const, label: 'Reembolso' },
}

interface TypeBadgeProps {
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'REFUND'
}

export function TypeBadge({ type }: TypeBadgeProps) {
  const t = TYPE_MAP[type] ?? TYPE_MAP.EXPENSE
  return (
    <Badge kind={t.kind} square dot={false}>
      {t.label}
    </Badge>
  )
}
