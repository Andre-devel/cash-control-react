import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCard } from '@/features/cards/api/cards.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { CARDS_QUERY_KEY } from './use-cards'
import type { CreateCardRequest, Card } from '@/features/cards/types'
import type { NormalizedError } from '@/features/auth/types'

interface UseCreateCardOptions {
  onFieldError?: (error: NormalizedError) => void
}

export function useCreateCard(options?: UseCreateCardOptions) {
  const queryClient = useQueryClient()

  return useMutation<Card, NormalizedError, CreateCardRequest>({
    mutationFn: createCard,
    onSuccess: () => {
      invalidateFinancialQueries(queryClient, [CARDS_QUERY_KEY])
      toast.success('Cartão criado com sucesso.')
    },
    onError: (error) => {
      if ((error.status === 409 || error.status === 422) && options?.onFieldError) {
        options.onFieldError(error)
        return
      }
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
