import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateInstallment } from '@/features/installments/api/installments.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { INSTALLMENTS_QUERY_KEY } from './use-installment-series'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
import type { UpdateInstallmentRequest } from '@/features/installments/types'
import type { NormalizedError } from '@/features/auth/types'

interface UpdateInstallmentVariables {
  transactionId: string
  data: UpdateInstallmentRequest
}

export function useUpdateInstallment() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, UpdateInstallmentVariables>({
    mutationFn: ({ transactionId, data }) => updateInstallment(transactionId, data),
    onSuccess: () => {
      invalidateFinancialQueries(queryClient, [INSTALLMENTS_QUERY_KEY, TRANSACTIONS_QUERY_KEY])
      toast.success('Parcela atualizada com sucesso.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
