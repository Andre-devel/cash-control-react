import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateInstallment } from '@/features/installments/api/installments.api'
import { toast } from '@/lib/toast'
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
      void queryClient.invalidateQueries({ queryKey: INSTALLMENTS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY })
      toast.success('Installment updated successfully.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
