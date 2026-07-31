import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateSeries } from '@/features/installments/api/installments.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { INSTALLMENTS_QUERY_KEY } from './use-installment-series'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
import type { EditSeriesRequest, InstallmentSeries } from '@/features/installments/types'

interface UpdateSeriesResponse {
  series: InstallmentSeries
  affectedInstallments: number
}
import type { NormalizedError } from '@/features/auth/types'

interface UpdateSeriesVariables {
  seriesId: string
  data: EditSeriesRequest
}

export function useUpdateSeries() {
  const queryClient = useQueryClient()

  return useMutation<UpdateSeriesResponse, NormalizedError, UpdateSeriesVariables>({
    mutationFn: ({ seriesId, data }) => updateSeries(seriesId, data),
    onSuccess: () => {
      invalidateFinancialQueries(queryClient, [INSTALLMENTS_QUERY_KEY, TRANSACTIONS_QUERY_KEY])
      toast.success('Parcelamento atualizado com sucesso.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
