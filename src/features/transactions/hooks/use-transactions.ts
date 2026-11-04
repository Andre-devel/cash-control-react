import { useQuery } from '@tanstack/react-query'
import { useScope } from '@/app/store/scope.store'
import {
  getTransactionTotals,
  listTransactions,
} from '@/features/transactions/api/transactions.api'
import type { ListTransactionsParams } from '@/features/transactions/types'

export const TRANSACTIONS_QUERY_KEY = ['transactions'] as const

export function useTransactions(params?: ListTransactionsParams) {
  const scope = useScope()
  return useQuery({
    queryKey: [...TRANSACTIONS_QUERY_KEY, params, scope],
    queryFn: () => listTransactions(params, scope),
  })
}

/** Totais do filtro inteiro: paginação, ordenação e agrupamento não mudam o resultado. */
export function useTransactionTotals(params: ListTransactionsParams = {}) {
  const { page: _page, size: _size, sort: _sort, groupInstallments: _group, ...filters } = params
  const scope = useScope()
  return useQuery({
    queryKey: [...TRANSACTIONS_QUERY_KEY, 'totals', filters, scope],
    queryFn: () => getTransactionTotals(filters, scope),
  })
}
