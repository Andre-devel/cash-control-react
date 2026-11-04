import { useQuery } from '@tanstack/react-query'
import { useScope } from '@/app/store/scope.store'
import { getMonthlyChart } from '@/features/dashboard/api/dashboard.api'

export function useMonthlyChart(months?: number) {
  const scope = useScope()
  return useQuery({
    queryKey: ['dashboard', 'charts', 'monthly', months, scope],
    queryFn: () => getMonthlyChart(months, scope),
    staleTime: 300_000,
  })
}
