import { useQueries } from '@tanstack/react-query'
import { getLimitUsage } from '@/features/cards/api/cards.api'
import type { LimitUsage } from '@/features/cards/types'
import { CARDS_QUERY_KEY } from './use-cards'

/**
 * Uso de limite de vários cartões de uma vez, indexado por id. Mesma chave e mesma
 * chamada de {@link useLimitUsage} — compartilha o cache, não faz requisição a mais.
 * Serve para somar o uso de um grupo de limite compartilhado.
 */
export function useCardsLimitUsage(cardIds: string[]): Record<string, LimitUsage | undefined> {
  return useQueries({
    queries: cardIds.map((id) => ({
      queryKey: [...CARDS_QUERY_KEY, id, 'limit'],
      queryFn: () => getLimitUsage(id),
      enabled: !!id,
    })),
    combine: (results) =>
      Object.fromEntries(cardIds.map((id, i) => [id, results[i]?.data])) as Record<
        string,
        LimitUsage | undefined
      >,
  })
}
