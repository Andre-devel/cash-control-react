import { useQuery } from '@tanstack/react-query'
import { listInstallmentSeries } from '@/features/installments/api/installments.api'

export const INSTALLMENTS_QUERY_KEY = ['installments', 'series'] as const

export function useInstallmentSeries() {
  return useQuery({
    queryKey: INSTALLMENTS_QUERY_KEY,
    queryFn: listInstallmentSeries,
  })
}
