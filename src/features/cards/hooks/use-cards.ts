import { useQuery } from '@tanstack/react-query'
import type { ScopeFilter } from '@/app/store/scope.store'
import { listCards } from '@/features/cards/api/cards.api'

export const CARDS_QUERY_KEY = ['cards'] as const

/**
 * Sem `scope` (ou com "Tudo") traz todos os cartões, sob a chave de sempre: é o que os
 * seletores de cartão dos formulários usam. A tela de cartões passa o filtro global.
 */
export function useCards(scope: ScopeFilter = 'ALL') {
  return useQuery({
    queryKey: scope === 'ALL' ? CARDS_QUERY_KEY : [...CARDS_QUERY_KEY, 'list', scope],
    queryFn: () => listCards(scope),
  })
}
