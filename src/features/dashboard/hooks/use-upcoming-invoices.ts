import { useQuery } from '@tanstack/react-query'
import { getUpcomingInvoices } from '@/features/dashboard/api/dashboard.api'

export const UPCOMING_INVOICES_QUERY_KEY = ['dashboard', 'widgets', 'upcoming-invoices'] as const

export function useUpcomingInvoices(daysAhead?: number) {
  return useQuery({
    queryKey: [...UPCOMING_INVOICES_QUERY_KEY, daysAhead],
    queryFn: () => getUpcomingInvoices(daysAhead),
    staleTime: 60_000,
  })
}
