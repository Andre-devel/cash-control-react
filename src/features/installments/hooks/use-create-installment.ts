import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createInstallmentSeries } from '@/features/installments/api/installments.api'
import { toast } from '@/lib/toast'
import { INSTALLMENTS_QUERY_KEY } from './use-installment-series'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
import { ACCOUNTS_QUERY_KEY } from '@/features/accounts/hooks/use-accounts'
import { CARDS_QUERY_KEY } from '@/features/cards/hooks/use-cards'
import type {
  CreateInstallmentSeriesRequest,
  InstallmentSeriesDetail,
} from '@/features/installments/types'
import type { NormalizedError } from '@/features/auth/types'

interface UseCreateInstallmentOptions {
  onFieldError?: (error: NormalizedError) => void
}

export function useCreateInstallment(options?: UseCreateInstallmentOptions) {
  const queryClient = useQueryClient()

  return useMutation<InstallmentSeriesDetail, NormalizedError, CreateInstallmentSeriesRequest>({
    mutationFn: createInstallmentSeries,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: INSTALLMENTS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: CARDS_QUERY_KEY })
      toast.success(
        `Installment series created with ${data.series.totalInstallments} installments.`,
      )
    },
    onError: (error) => {
      if ((error.status === 409 || error.status === 422) && options?.onFieldError) {
        options.onFieldError(error)
        return
      }
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
