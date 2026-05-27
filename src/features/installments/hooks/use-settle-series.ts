import { useMutation, useQueryClient } from '@tanstack/react-query'
import { settleSeries } from '@/features/installments/api/installments.api'
import { toast } from '@/lib/toast'
import { INSTALLMENTS_QUERY_KEY } from './use-installment-series'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
import { ACCOUNTS_QUERY_KEY } from '@/features/accounts/hooks/use-accounts'
import type { NormalizedError } from '@/features/auth/types'

export function useSettleSeries() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, string>({
    mutationFn: settleSeries,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INSTALLMENTS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY })
      toast.success('Series settled successfully.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
