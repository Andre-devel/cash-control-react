import { useQuery } from '@tanstack/react-query'
import { useScope } from '@/app/store/scope.store'
import { getNetWorthChart } from '@/features/dashboard/api/dashboard.api'
import type { NetWorthChartParams } from '@/features/dashboard/types'

export function useNetWorthChart(params: NetWorthChartParams) {
  const scope = useScope()
  return useQuery({
    queryKey: ['dashboard', 'charts', 'net-worth', params, scope],
    queryFn: () => getNetWorthChart(params, scope),
    staleTime: 300_000,
  })
}
