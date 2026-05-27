import { useMutation, useQueryClient } from '@tanstack/react-query'
import { recordCharge } from '@/features/cards/api/cards.api'
import { toast } from '@/lib/toast'
import { CARDS_QUERY_KEY } from './use-cards'
import type { RecordChargeRequest } from '@/features/cards/types'
import type { NormalizedError } from '@/features/auth/types'

export function useRecordCharge(cardId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, RecordChargeRequest>({
    mutationFn: (data) => recordCharge(cardId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CARDS_QUERY_KEY })
      toast.success('Charge recorded successfully.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
