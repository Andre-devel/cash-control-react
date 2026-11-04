import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getCardReconciliation, reconcileCard } from '@/features/accounts/api/accounts.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
import { INVOICES_QUERY_KEY } from '@/features/invoices/hooks/use-invoices'
import { CARDS_QUERY_KEY } from './use-cards'
import type { ReconcileCardRequest } from '@/features/accounts/types'
import type { NormalizedError } from '@/features/auth/types'

/** Sob `CARDS_QUERY_KEY`: invalidar os cartões já recarrega a conciliação. */
export function cardReconciliationKey(cardId: string) {
  return [...CARDS_QUERY_KEY, cardId, 'reconciliation'] as const
}

export function useCardReconciliation(cardId: string) {
  return useQuery({
    queryKey: cardReconciliationKey(cardId),
    queryFn: () => getCardReconciliation(cardId),
    enabled: !!cardId,
  })
}

interface ReconcileCardVariables {
  cardId: string
  data: ReconcileCardRequest
}

export function useReconcileCard() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, ReconcileCardVariables>({
    mutationFn: ({ cardId, data }) => reconcileCard(cardId, data),
    onSuccess: () => {
      invalidateFinancialQueries(queryClient, [
        CARDS_QUERY_KEY,
        INVOICES_QUERY_KEY,
        TRANSACTIONS_QUERY_KEY,
      ])
      toast.success('Diferença lançada na fatura aberta.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
