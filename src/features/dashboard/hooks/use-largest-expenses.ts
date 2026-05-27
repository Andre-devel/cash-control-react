import { useQuery } from '@tanstack/react-query'
import { getLargestExpenses } from '@/features/dashboard/api/dashboard.api'

export function useLargestExpenses(limit?: number) {
  return useQuery({
    queryKey: ['dashboard', 'widgets', 'largest-expenses', limit],
    queryFn: () => getLargestExpenses(limit),
    staleTime: 120_000,
  })
}
