import { useQuery } from '@tanstack/react-query'
import { useScope } from '@/app/store/scope.store'
import { getCategoriesChart } from '@/features/dashboard/api/dashboard.api'
import type { CategoriesChartParams } from '@/features/dashboard/types'

export function useCategoriesChart(params: CategoriesChartParams) {
  const scope = useScope()
  return useQuery({
    queryKey: ['dashboard', 'charts', 'categories', params, scope],
    queryFn: () => getCategoriesChart(params, scope),
    staleTime: 300_000,
  })
}
