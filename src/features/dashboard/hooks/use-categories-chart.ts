import { useQuery } from '@tanstack/react-query'
import { getCategoriesChart } from '@/features/dashboard/api/dashboard.api'
import type { CategoriesChartParams } from '@/features/dashboard/types'

export function useCategoriesChart(params: CategoriesChartParams) {
  return useQuery({
    queryKey: ['dashboard', 'charts', 'categories', params],
    queryFn: () => getCategoriesChart(params),
    staleTime: 300_000,
  })
}
