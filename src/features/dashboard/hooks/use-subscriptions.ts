import { useQuery } from '@tanstack/react-query'
import { useScope } from '@/app/store/scope.store'
import { getSubscriptions } from '@/features/dashboard/api/dashboard.api'

export function useSubscriptions() {
  const scope = useScope()
  return useQuery({
    queryKey: ['dashboard', 'subscriptions', scope],
    queryFn: () => getSubscriptions(scope),
    staleTime: 60_000,
  })
}
