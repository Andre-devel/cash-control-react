import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCard } from '@/features/cards/api/cards.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { CARDS_QUERY_KEY } from './use-cards'
import type { UpdateCardRequest, Card } from '@/features/cards/types'
import type { NormalizedError } from '@/features/auth/types'

export function useUpdateCard() {
  const queryClient = useQueryClient()

  return useMutation<Card, NormalizedError, { id: string; data: UpdateCardRequest }>({
    mutationFn: ({ id, data }) => updateCard(id, data),
    onSuccess: () => {
      invalidateFinancialQueries(queryClient, [CARDS_QUERY_KEY])
      toast.success('Cartão atualizado com sucesso.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
