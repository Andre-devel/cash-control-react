import { useQuery } from '@tanstack/react-query'
import { getSubscriptions } from '@/features/dashboard/api/dashboard.api'

export function useSubscriptions() {
  return useQuery({
    queryKey: ['dashboard', 'subscriptions'],
    queryFn: getSubscriptions,
    staleTime: 60_000,
  })
}
