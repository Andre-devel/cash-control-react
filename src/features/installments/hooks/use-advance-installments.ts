import { useMutation, useQueryClient } from '@tanstack/react-query'
import { advanceInstallments } from '@/features/installments/api/installments.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
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
      invalidateFinancialQueries(queryClient, [
        INSTALLMENTS_QUERY_KEY,
        TRANSACTIONS_QUERY_KEY,
        ACCOUNTS_QUERY_KEY,
      ])
      const count = variables.installmentIds.length
      toast.success(
        `${count} parcela${count > 1 ? 's' : ''} antecipada${count > 1 ? 's' : ''} com sucesso.`,
      )
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
