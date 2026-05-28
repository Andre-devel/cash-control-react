import { useMutation, useQueryClient } from '@tanstack/react-query'
import { advanceInstallments } from '@/features/installments/api/installments.api'
import { toast } from '@/lib/toast'
import { INSTALLMENTS_QUERY_KEY } from './use-installment-series'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
import { ACCOUNTS_QUERY_KEY } from '@/features/accounts/hooks/use-accounts'
import type { AdvanceInstallmentsRequest } from '@/features/installments/types'
import type { NormalizedError } from '@/features/auth/types'

export function useAdvanceInstallments() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, AdvanceInstallmentsRequest>({
    mutationFn: advanceInstallments,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: INSTALLMENTS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY })
      const count = variables.transactionIds.length
      toast.success(`${count} installment${count > 1 ? 's' : ''} advanced successfully.`)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
