import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteRecurrence } from '@/features/recurrences/api/recurrences.api'
import { toast } from '@/lib/toast'
import { RECURRENCES_QUERY_KEY } from './use-recurrences'
import type { DeleteRecurrenceParams } from '@/features/recurrences/types'
import type { NormalizedError } from '@/features/auth/types'

export function useDeleteRecurrence() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, DeleteRecurrenceParams>({
    mutationFn: ({ id, strategy }) => deleteRecurrence(id, strategy),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RECURRENCES_QUERY_KEY })
      toast.success('Recurrence rule deleted.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
