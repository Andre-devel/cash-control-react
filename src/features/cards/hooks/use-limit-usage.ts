import { useQuery } from '@tanstack/react-query'
import { getLimitUsage } from '@/features/cards/api/cards.api'
import { CARDS_QUERY_KEY } from './use-cards'

export function useLimitUsage(cardId: string) {
  return useQuery({
    queryKey: [...CARDS_QUERY_KEY, cardId, 'limit'],
    queryFn: () => getLimitUsage(cardId),
    enabled: !!cardId,
  })
}
