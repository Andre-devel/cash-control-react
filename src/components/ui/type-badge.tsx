import { Badge } from './badge'
import type { TransactionType } from '@/features/transactions/types'
import {
  TRANSACTION_TYPE_DISPLAY,
  transactionTypeBadgeKind,
} from '@/features/transactions/utils/transaction-type'

interface TypeBadgeProps {
  type: TransactionType
  /**
   * Necessário para tipos cuja cor depende do sinal (MANUAL_ADJUSTMENT).
   * Sem ele o badge fica neutro em vez de assumir "Despesa".
   */
  amount?: number
}

export function TypeBadge({ type, amount }: TypeBadgeProps) {
  const { label } = TRANSACTION_TYPE_DISPLAY[type]
  return (
    <Badge kind={transactionTypeBadgeKind(type, amount)} square dot={false}>
      {label}
    </Badge>
  )
}
