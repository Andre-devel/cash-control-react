import { useQuery } from '@tanstack/react-query'
import { useScope } from '@/app/store/scope.store'
import { getUpcomingBills } from '@/features/dashboard/api/dashboard.api'

export function useUpcomingBills(daysAhead?: number) {
  const scope = useScope()
  return useQuery({
    queryKey: ['dashboard', 'widgets', 'upcoming-bills', daysAhead, scope],
    queryFn: () => getUpcomingBills(daysAhead, scope),
    staleTime: 60_000,
  })
}
