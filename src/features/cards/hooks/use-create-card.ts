import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCard } from '@/features/cards/api/cards.api'
import { toast } from '@/lib/toast'
import { CARDS_QUERY_KEY } from './use-cards'
import type { CreateCardRequest, Card } from '@/features/cards/types'
import type { NormalizedError } from '@/features/auth/types'

export function useCreateCard() {
  const queryClient = useQueryClient()

  return useMutation<Card, NormalizedError, CreateCardRequest>({
    mutationFn: createCard,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CARDS_QUERY_KEY })
      toast.success('Card created successfully.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
