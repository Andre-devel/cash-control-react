import { useQuery } from '@tanstack/react-query'
import { getBudgetProgress } from '@/features/budgets/api/budgets.api'
import { DASHBOARD_QUERY_KEY } from '@/lib/invalidate-financial-queries'

/**
 * Fica sob a chave do dashboard de propósito: toda mutação que move dinheiro já invalida
 * `['dashboard']` por `invalidateFinancialQueries`, e o gasto do orçamento muda junto.
 */
export const BUDGETS_QUERY_KEY = [...DASHBOARD_QUERY_KEY, 'budgets'] as const

export function useBudgetProgress(month: string) {
  return useQuery({
    queryKey: [...BUDGETS_QUERY_KEY, month],
    queryFn: () => getBudgetProgress(month),
    staleTime: 60_000,
  })
}
