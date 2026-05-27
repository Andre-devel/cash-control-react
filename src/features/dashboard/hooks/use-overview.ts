import { useQuery } from '@tanstack/react-query'
import { getOverview } from '@/features/dashboard/api/dashboard.api'

export const OVERVIEW_QUERY_KEY = ['dashboard', 'overview'] as const

export function useOverview() {
  return useQuery({
    queryKey: OVERVIEW_QUERY_KEY,
    queryFn: getOverview,
    staleTime: 60_000,
  })
}
