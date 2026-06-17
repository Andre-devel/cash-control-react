import { useQuery } from '@tanstack/react-query'
import { getInstallmentSeriesDetail } from '@/features/installments/api/installments.api'
import type { InstallmentSeriesDetail } from '@/features/installments/types'

export const installmentSeriesDetailQueryKey = (id: string) =>
  ['installments', 'series', 'detail', id] as const

export function useInstallmentSeriesDetail(seriesId: string | null | undefined) {
  return useQuery<InstallmentSeriesDetail>({
    queryKey: installmentSeriesDetailQueryKey(seriesId ?? ''),
    queryFn: () => getInstallmentSeriesDetail(seriesId!),
    enabled: !!seriesId,
  })
}
