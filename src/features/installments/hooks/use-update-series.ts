import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateSeries } from '@/features/installments/api/installments.api'
import { toast } from '@/lib/toast'
import { INSTALLMENTS_QUERY_KEY } from './use-installment-series'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
import type { EditSeriesRequest, InstallmentSeries } from '@/features/installments/types'
import type { NormalizedError } from '@/features/auth/types'

interface UpdateSeriesVariables {
  seriesId: string
  data: EditSeriesRequest
}

export function useUpdateSeries() {
  const queryClient = useQueryClient()

  return useMutation<InstallmentSeries, NormalizedError, UpdateSeriesVariables>({
    mutationFn: ({ seriesId, data }) => updateSeries(seriesId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INSTALLMENTS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY })
      toast.success('Installment series updated successfully.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
