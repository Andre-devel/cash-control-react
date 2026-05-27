import { useQuery } from '@tanstack/react-query'
import { listTransactions } from '@/features/transactions/api/transactions.api'
import type { ListTransactionsParams } from '@/features/transactions/types'

export const TRANSACTIONS_QUERY_KEY = ['transactions'] as const

export function useTransactions(params?: ListTransactionsParams) {
  return useQuery({
    queryKey: [...TRANSACTIONS_QUERY_KEY, params],
    queryFn: () => listTransactions(params),
  })
}
