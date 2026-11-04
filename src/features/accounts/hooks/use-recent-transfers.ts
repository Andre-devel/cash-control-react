import { useQuery } from '@tanstack/react-query'
import { listTransactions } from '@/features/transactions/api/transactions.api'
import { pairTransferLegs } from '@/features/accounts/utils/pair-transfer-legs'

export const RECENT_TRANSFERS_QUERY_KEY = ['transactions', 'recent-transfers'] as const

/**
 * Últimas `limit` transferências, uma por item (as duas pernas juntas). Busca o dobro de
 * lançamentos porque cada transferência tem duas pernas.
 */
export function useRecentTransfers(limit = 4) {
  return useQuery({
    queryKey: [...RECENT_TRANSFERS_QUERY_KEY, limit],
    queryFn: () => listTransactions({ type: 'TRANSFER', size: limit * 2 }),
    select: (data) => pairTransferLegs(data.content).slice(0, limit),
  })
}
