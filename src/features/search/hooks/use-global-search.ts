import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useDebounce } from '@/hooks/use-debounce'
import { globalSearch } from '@/features/search/api/search.api'
import { DASHBOARD_QUERY_KEY } from '@/lib/invalidate-financial-queries'

/** Mínimo de caracteres que a API aceita em `GET /search`. */
export const SEARCH_MIN_LENGTH = 2
export const SEARCH_DEBOUNCE_MS = 250

/**
 * Sob a chave do dashboard: os resultados mostram saldos e lançamentos, e toda mutação que
 * move dinheiro já invalida `['dashboard']` por `invalidateFinancialQueries`.
 */
export const SEARCH_QUERY_KEY = [...DASHBOARD_QUERY_KEY, 'search'] as const

/**
 * Busca global com debounce de 250 ms. Só consulta com `q` (aparado) de 2 ou mais caracteres;
 * abaixo disso a query fica desligada e não devolve dado.
 */
export function useGlobalSearch(q: string) {
  const debounced = useDebounce(q.trim(), SEARCH_DEBOUNCE_MS)
  const enabled = debounced.length >= SEARCH_MIN_LENGTH

  const query = useQuery({
    queryKey: [...SEARCH_QUERY_KEY, debounced],
    queryFn: ({ signal }) => globalSearch(debounced, signal),
    enabled,
    staleTime: 30_000,
    // Mantém a lista anterior enquanto a próxima tecla busca: evita a lista piscar vazia.
    placeholderData: keepPreviousData,
  })

  return { ...query, data: enabled ? query.data : undefined, debouncedQuery: debounced, enabled }
}
