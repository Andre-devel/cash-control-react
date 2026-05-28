import { useQuery } from '@tanstack/react-query'
import { getInstallmentSeriesDetail } from '@/features/installments/api/installments.api'

export const installmentSeriesDetailQueryKey = (id: string) =>
  ['installments', 'detail', id] as const

export function useInstallmentSeriesDetail(seriesId: string | null | undefined) {
  return useQuery({
    queryKey: installmentSeriesDetailQueryKey(seriesId ?? ''),
    queryFn: () => getInstallmentSeriesDetail(seriesId!),
    enabled: !!seriesId,
  })
}
