import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createRecurrence } from '@/features/recurrences/api/recurrences.api'
import { toast } from '@/lib/toast'
import { RECURRENCES_QUERY_KEY } from './use-recurrences'
import type { CreateRecurrenceRequest, Recurrence } from '@/features/recurrences/types'
import type { NormalizedError } from '@/features/auth/types'

export function useCreateRecurrence() {
  const queryClient = useQueryClient()

  return useMutation<Recurrence, NormalizedError, CreateRecurrenceRequest>({
    mutationFn: createRecurrence,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RECURRENCES_QUERY_KEY })
      toast.success('Recurrence rule created successfully.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
