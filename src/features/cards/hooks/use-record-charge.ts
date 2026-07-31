import { useMutation, useQueryClient } from '@tanstack/react-query'
import { recordCharge } from '@/features/cards/api/cards.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
import { CARDS_QUERY_KEY } from './use-cards'
import type { RecordChargeRequest } from '@/features/cards/types'
import type { NormalizedError } from '@/features/auth/types'

export function useRecordCharge(cardId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, RecordChargeRequest>({
    mutationFn: (data) => recordCharge(cardId, data),
    onSuccess: () => {
      invalidateFinancialQueries(queryClient, [CARDS_QUERY_KEY, TRANSACTIONS_QUERY_KEY])
      toast.success('Lançamento registrado com sucesso.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
