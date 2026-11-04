import { useQuery } from '@tanstack/react-query'
import { useScope } from '@/app/store/scope.store'
import { getBalanceProjection } from '@/features/dashboard/api/dashboard.api'

export function useBalanceProjection(days: number) {
  const scope = useScope()
  return useQuery({
    queryKey: ['dashboard', 'projection', days, scope],
    queryFn: () => getBalanceProjection(days, scope),
    staleTime: 60_000,
  })
}
