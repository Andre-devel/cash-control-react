import { useQuery } from '@tanstack/react-query'
import { getInvoice } from '@/features/cards/api/cards.api'
import { CARDS_QUERY_KEY } from './use-cards'

export function useInvoice(cardId: string, referenceMonth: string) {
  return useQuery({
    queryKey: [...CARDS_QUERY_KEY, cardId, 'invoices', referenceMonth],
    queryFn: () => getInvoice(cardId, referenceMonth),
    enabled: !!cardId && !!referenceMonth,
  })
}
