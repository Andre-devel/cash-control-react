import { useMutation, useQueryClient } from '@tanstack/react-query'
import { settleSeries } from '@/features/installments/api/installments.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { INSTALLMENTS_QUERY_KEY } from './use-installment-series'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
import { ACCOUNTS_QUERY_KEY } from '@/features/accounts/hooks/use-accounts'
import type { NormalizedError } from '@/features/auth/types'

export function useSettleSeries() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, string>({
    mutationFn: settleSeries,
    onSuccess: () => {
      invalidateFinancialQueries(queryClient, [
        INSTALLMENTS_QUERY_KEY,
        TRANSACTIONS_QUERY_KEY,
        ACCOUNTS_QUERY_KEY,
      ])
      toast.success('Parcelamento quitado com sucesso.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
