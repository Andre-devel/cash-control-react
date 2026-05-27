import { useQuery } from '@tanstack/react-query'
import { getSpendingBreakdown } from '@/features/cards/api/cards.api'
import { CARDS_QUERY_KEY } from './use-cards'
import type { SpendingBreakdownParams } from '@/features/cards/types'

export function useSpendingBreakdown(cardId: string, params: SpendingBreakdownParams) {
  return useQuery({
    queryKey: [...CARDS_QUERY_KEY, cardId, 'spending', params],
    queryFn: () => getSpendingBreakdown(cardId, params),
    enabled: !!cardId && !!params.from && !!params.to,
  })
}
