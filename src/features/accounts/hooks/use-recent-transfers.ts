import { useQuery } from '@tanstack/react-query'
import { listTransfers } from '@/features/accounts/api/accounts.api'

export const TRANSFERS_QUERY_KEY = ['accounts', 'transfers'] as const

export function useRecentTransfers(limit = 4) {
  return useQuery({
    queryKey: [...TRANSFERS_QUERY_KEY, limit],
    queryFn: listTransfers,
    select: (data) => data.slice(0, limit),
  })
}
