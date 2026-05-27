import { useQuery } from '@tanstack/react-query'
import { listCards } from '@/features/cards/api/cards.api'

export const CARDS_QUERY_KEY = ['cards'] as const

export function useCards() {
  return useQuery({
    queryKey: CARDS_QUERY_KEY,
    queryFn: listCards,
  })
}
