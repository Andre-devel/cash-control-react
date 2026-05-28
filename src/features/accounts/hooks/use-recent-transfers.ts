import { useQuery } from '@tanstack/react-query'
import { listTransactions } from '@/features/transactions/api/transactions.api'

export const RECENT_TRANSFERS_QUERY_KEY = ['transactions', 'recent-transfers'] as const

export function useRecentTransfers(limit = 4) {
  return useQuery({
    queryKey: [...RECENT_TRANSFERS_QUERY_KEY, limit],
    queryFn: () => listTransactions({ type: 'TRANSFER', size: limit }),
    select: (data) => data.content,
  })
}
