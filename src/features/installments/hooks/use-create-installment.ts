import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createInstallmentSeries } from '@/features/installments/api/installments.api'
import { toast } from '@/lib/toast'
import { INSTALLMENTS_QUERY_KEY } from './use-installment-series'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
import { ACCOUNTS_QUERY_KEY } from '@/features/accounts/hooks/use-accounts'
import type {
  CreateInstallmentSeriesRequest,
  InstallmentSeries,
} from '@/features/installments/types'
import type { NormalizedError } from '@/features/auth/types'

export function useCreateInstallment() {
  const queryClient = useQueryClient()

  return useMutation<InstallmentSeries, NormalizedError, CreateInstallmentSeriesRequest>({
    mutationFn: createInstallmentSeries,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: INSTALLMENTS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY })
      toast.success(`Installment series created with ${data.installmentCount} installments.`)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
