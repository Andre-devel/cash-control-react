import { useQuery } from '@tanstack/react-query'
import { useScope } from '@/app/store/scope.store'
import { getRecentTransactions } from '@/features/dashboard/api/dashboard.api'

export function useRecentTransactions(limit?: number) {
  const scope = useScope()
  return useQuery({
    queryKey: ['dashboard', 'widgets', 'recent-transactions', limit, scope],
    queryFn: () => getRecentTransactions(limit, scope),
    staleTime: 60_000,
  })
}
