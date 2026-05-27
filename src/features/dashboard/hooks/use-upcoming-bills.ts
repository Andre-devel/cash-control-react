import { useQuery } from '@tanstack/react-query'
import { getUpcomingBills } from '@/features/dashboard/api/dashboard.api'

export function useUpcomingBills(daysAhead?: number) {
  return useQuery({
    queryKey: ['dashboard', 'widgets', 'upcoming-bills', daysAhead],
    queryFn: () => getUpcomingBills(daysAhead),
    staleTime: 60_000,
  })
}
