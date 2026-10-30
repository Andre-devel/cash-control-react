import { useQuery } from '@tanstack/react-query'
import { getBalanceProjection } from '@/features/dashboard/api/dashboard.api'

export function useBalanceProjection(days: number) {
  return useQuery({
    queryKey: ['dashboard', 'projection', days],
    queryFn: () => getBalanceProjection(days),
    staleTime: 60_000,
  })
}
