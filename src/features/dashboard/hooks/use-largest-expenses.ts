import { useQuery } from '@tanstack/react-query'
import { useScope } from '@/app/store/scope.store'
import { getLargestExpenses } from '@/features/dashboard/api/dashboard.api'

export function useLargestExpenses(limit?: number, range?: { from: string; to: string }) {
  const scope = useScope()
  return useQuery({
    queryKey: ['dashboard', 'widgets', 'largest-expenses', limit, range, scope],
    queryFn: () => getLargestExpenses(limit, range, scope),
    staleTime: 120_000,
  })
}
