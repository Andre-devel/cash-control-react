import { useMutation, useQueryClient } from '@tanstack/react-query'
import { archiveCard } from '@/features/cards/api/cards.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { CARDS_QUERY_KEY } from './use-cards'
import type { NormalizedError } from '@/features/auth/types'

export function useArchiveCard() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, string>({
    mutationFn: archiveCard,
    onSuccess: () => {
      invalidateFinancialQueries(queryClient, [CARDS_QUERY_KEY])
      toast.success('Cartão arquivado com sucesso.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
