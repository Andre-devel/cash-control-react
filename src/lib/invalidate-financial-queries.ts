import type { QueryClient, QueryKey } from '@tanstack/react-query'

/**
 * Chave raiz de todos os widgets e gráficos do dashboard. A invalidação do
 * TanStack Query é por prefixo, então esta única chave cobre `overview`,
 * `charts` e `widgets` de uma vez.
 */
export const DASHBOARD_QUERY_KEY = ['dashboard'] as const

/**
 * Invalida o dashboard junto com as chaves informadas.
 *
 * Toda mutação que altere valores financeiros (transações, contas, cartões,
 * parcelamentos, recorrências, categorias) deve invalidar por aqui: invalidar
 * apenas a lista da própria feature deixa o dashboard defasado até o próximo
 * recarregamento da página.
 */
export function invalidateFinancialQueries(
  queryClient: QueryClient,
  keys: readonly QueryKey[] = [],
): void {
  for (const key of [...keys, DASHBOARD_QUERY_KEY]) {
    void queryClient.invalidateQueries({ queryKey: key })
  }
}
