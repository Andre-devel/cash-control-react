import { useQuery } from '@tanstack/react-query'
import { useScope } from '@/app/store/scope.store'
import { getUpcomingInvoices } from '@/features/dashboard/api/dashboard.api'

export const UPCOMING_INVOICES_QUERY_KEY = ['dashboard', 'widgets', 'upcoming-invoices'] as const

export function useUpcomingInvoices(daysAhead?: number) {
  const scope = useScope()
  return useQuery({
    queryKey: [...UPCOMING_INVOICES_QUERY_KEY, daysAhead, scope],
    queryFn: () => getUpcomingInvoices(daysAhead, scope),
    staleTime: 60_000,
  })
}
