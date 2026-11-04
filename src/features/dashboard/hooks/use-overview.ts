import { useQuery } from '@tanstack/react-query'
import { useScope } from '@/app/store/scope.store'
import { getOverview } from '@/features/dashboard/api/dashboard.api'

export const OVERVIEW_QUERY_KEY = ['dashboard', 'overview'] as const

export function useOverview() {
  const scope = useScope()
  return useQuery({
    queryKey: [...OVERVIEW_QUERY_KEY, scope],
    queryFn: () => getOverview(scope),
    staleTime: 60_000,
  })
}
