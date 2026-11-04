import { useQuery } from '@tanstack/react-query'
import { useScope } from '@/app/store/scope.store'
import { getComparisonChart } from '@/features/dashboard/api/dashboard.api'
import type { ComparisonChartParams } from '@/features/dashboard/types'

export function useComparisonChart(params: ComparisonChartParams) {
  const scope = useScope()
  return useQuery({
    queryKey: ['dashboard', 'charts', 'comparison', params, scope],
    queryFn: () => getComparisonChart(params, scope),
    staleTime: 300_000,
  })
}
