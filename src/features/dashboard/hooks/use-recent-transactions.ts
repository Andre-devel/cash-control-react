import { useQuery } from '@tanstack/react-query'
import { getRecentTransactions } from '@/features/dashboard/api/dashboard.api'

export function useRecentTransactions(limit?: number) {
  return useQuery({
    queryKey: ['dashboard', 'widgets', 'recent-transactions', limit],
    queryFn: () => getRecentTransactions(limit),
    staleTime: 60_000,
  })
}
