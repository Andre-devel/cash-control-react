import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteInstallmentSeries } from '@/features/installments/api/installments.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { INSTALLMENTS_QUERY_KEY } from './use-installment-series'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
import type { NormalizedError } from '@/features/auth/types'

export function useDeleteSeries() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, string>({
    mutationFn: deleteInstallmentSeries,
    onSuccess: () => {
      invalidateFinancialQueries(queryClient, [INSTALLMENTS_QUERY_KEY, TRANSACTIONS_QUERY_KEY])
      toast.success('Parcelamento excluído.')
    },
    onError: (error) => {
      // Regras de negócio (parcela paga, fatura fechada) aparecem no próprio diálogo.
      if (error.status >= 500) toast.error(error.message, error.correlationId)
    },
  })
}
