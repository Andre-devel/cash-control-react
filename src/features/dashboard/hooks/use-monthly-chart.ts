import { useQuery } from '@tanstack/react-query'
import { getMonthlyChart } from '@/features/dashboard/api/dashboard.api'

export function useMonthlyChart(months?: number) {
  return useQuery({
    queryKey: ['dashboard', 'charts', 'monthly', months],
    queryFn: () => getMonthlyChart(months),
    staleTime: 300_000,
  })
}
