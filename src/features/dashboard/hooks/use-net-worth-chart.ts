import { useQuery } from '@tanstack/react-query'
import { getNetWorthChart } from '@/features/dashboard/api/dashboard.api'
import type { NetWorthChartParams } from '@/features/dashboard/types'

export function useNetWorthChart(params: NetWorthChartParams) {
  return useQuery({
    queryKey: ['dashboard', 'charts', 'net-worth', params],
    queryFn: () => getNetWorthChart(params),
    staleTime: 300_000,
  })
}
