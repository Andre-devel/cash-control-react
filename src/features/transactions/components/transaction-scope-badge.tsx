import { Badge } from '@/components/ui/badge'
import { ScopeBadge } from '@/components/ui/scope-badge'
import { useCards } from '@/features/cards/hooks/use-cards'
import type { Account } from '@/features/accounts/types'
import type { Transaction } from '@/features/transactions/types'
import { CROSS_SCOPE_LABEL } from '@/features/transactions/utils/transaction-display'

interface TransactionScopeBadgeProps {
  transaction: Transaction
  accounts: Account[]
}

/**
 * Selo "PJ" do lançamento. A API não devolve o escopo da transação: ele é o do cartão, na
 * compra no cartão, senão o da conta (mesma regra do backend).
 */
export function TransactionScopeBadge({ transaction, accounts }: TransactionScopeBadgeProps) {
  const { data: cards } = useCards()
  const scope = transaction.creditCard
    ? cards?.find((c) => c.id === transaction.creditCard?.id)?.scope
    : accounts.find((a) => a.id === transaction.accountId)?.scope
  return <ScopeBadge scope={scope} />
}

/** Transferência entre uma conta PF e uma PJ: "Pró-labore / aporte", fora de receita e despesa. */
export function CrossScopeBadge({ transaction }: { transaction: Transaction }) {
  if (!transaction.crossScope) return null
  return (
    <span title="Transferência entre conta pessoal e da empresa: não conta como receita nem despesa">
      <Badge kind="info" dot={false}>
        {CROSS_SCOPE_LABEL}
      </Badge>
    </span>
  )
}
