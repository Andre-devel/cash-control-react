import { useMutation, useQueryClient } from '@tanstack/react-query'
import { archiveCard } from '@/features/cards/api/cards.api'
import { toast } from '@/lib/toast'
import { CARDS_QUERY_KEY } from './use-cards'
import type { NormalizedError } from '@/features/auth/types'

export function useArchiveCard() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, string>({
    mutationFn: archiveCard,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CARDS_QUERY_KEY })
      toast.success('Card archived successfully.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
