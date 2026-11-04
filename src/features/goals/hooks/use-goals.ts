import { useQuery } from '@tanstack/react-query'
import { listGoals } from '@/features/goals/api/goals.api'
import { DASHBOARD_QUERY_KEY } from '@/lib/invalidate-financial-queries'

/**
 * Sob a chave do dashboard de propósito: o progresso vem do saldo da conta ou da aplicação,
 * e toda mutação que move dinheiro já invalida `['dashboard']` por `invalidateFinancialQueries`.
 */
export const GOALS_QUERY_KEY = [...DASHBOARD_QUERY_KEY, 'goals'] as const

export function useGoals() {
  return useQuery({
    queryKey: GOALS_QUERY_KEY,
    queryFn: listGoals,
    staleTime: 60_000,
  })
}
