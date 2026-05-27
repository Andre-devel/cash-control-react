import { useMutation, useQueryClient } from '@tanstack/react-query'
import { pauseRecurrence } from '@/features/recurrences/api/recurrences.api'
import { toast } from '@/lib/toast'
import { RECURRENCES_QUERY_KEY } from './use-recurrences'
import type { NormalizedError } from '@/features/auth/types'

export function usePauseRecurrence() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, string>({
    mutationFn: pauseRecurrence,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RECURRENCES_QUERY_KEY })
      toast.success('Recurrence rule paused.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
