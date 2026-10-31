import { Badge } from '@/components/ui/badge'
import type { Transaction } from '@/features/transactions/types'

/** Selo da lista: despesa a reembolsar, despesa reembolsada ou receita que é reembolso. */
export function ReimbursementBadge({ transaction }: { transaction: Transaction }) {
  const r = transaction.reimbursement
  if (!r) return null
  const label = !r.reimbursable
    ? 'Reembolso'
    : r.linkedTransactionId
      ? 'Reembolsada'
      : 'A reembolsar'
  const title = r.linkedDescription
    ? `${r.reimbursable ? 'Reembolsada por' : 'Reembolso de'} ${r.linkedDescription} — fora dos gráficos`
    : 'Fora dos gráficos até o reembolso ser vinculado'
  return (
    <span title={title}>
      <Badge kind={r.reimbursable && !r.linkedTransactionId ? 'pending' : 'info'} dot={false}>
        {label}
      </Badge>
    </span>
  )
}
