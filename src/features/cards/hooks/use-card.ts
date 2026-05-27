import { useQuery } from '@tanstack/react-query'
import { getCard } from '@/features/cards/api/cards.api'
import { CARDS_QUERY_KEY } from './use-cards'

export function useCard(id: string) {
  return useQuery({
    queryKey: [...CARDS_QUERY_KEY, id],
    queryFn: () => getCard(id),
    enabled: !!id,
  })
}
