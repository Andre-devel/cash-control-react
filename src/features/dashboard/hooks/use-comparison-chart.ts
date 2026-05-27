import { useQuery } from '@tanstack/react-query'
import { getComparisonChart } from '@/features/dashboard/api/dashboard.api'
import type { ComparisonChartParams } from '@/features/dashboard/types'

export function useComparisonChart(params: ComparisonChartParams) {
  return useQuery({
    queryKey: ['dashboard', 'charts', 'comparison', params],
    queryFn: () => getComparisonChart(params),
    staleTime: 300_000,
  })
}
