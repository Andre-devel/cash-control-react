import { useQuery } from '@tanstack/react-query'
import {
  getTransactionTotals,
  listTransactions,
} from '@/features/transactions/api/transactions.api'
import type { ListTransactionsParams } from '@/features/transactions/types'

export const TRANSACTIONS_QUERY_KEY = ['transactions'] as const

export function useTransactions(params?: ListTransactionsParams) {
  return useQuery({
    queryKey: [...TRANSACTIONS_QUERY_KEY, params],
    queryFn: () => listTransactions(params),
  })
}

/** Totais do filtro inteiro: paginação, ordenação e agrupamento não mudam o resultado. */
export function useTransactionTotals(params: ListTransactionsParams = {}) {
  const { page: _page, size: _size, sort: _sort, groupInstallments: _group, ...filters } = params
  return useQuery({
    queryKey: [...TRANSACTIONS_QUERY_KEY, 'totals', filters],
    queryFn: () => getTransactionTotals(filters),
  })
}
