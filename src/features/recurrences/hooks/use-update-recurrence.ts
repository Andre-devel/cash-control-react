import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateRecurrence } from '@/features/recurrences/api/recurrences.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
import { RECURRENCES_QUERY_KEY } from './use-recurrences'
import type { UpdateRecurrenceRequest, EditRecurrenceResult } from '@/features/recurrences/types'
import type { NormalizedError } from '@/features/auth/types'

interface UpdateRecurrenceVariables {
  id: string
  data: UpdateRecurrenceRequest
}

export function useUpdateRecurrence() {
  const queryClient = useQueryClient()

  return useMutation<EditRecurrenceResult, NormalizedError, UpdateRecurrenceVariables>({
    mutationFn: ({ id, data }) => updateRecurrence(id, data),
    onSuccess: (_, { id }) => {
      invalidateFinancialQueries(queryClient, [
        RECURRENCES_QUERY_KEY,
        [...RECURRENCES_QUERY_KEY, id],
        TRANSACTIONS_QUERY_KEY,
      ])
      toast.success('Recorrência atualizada com sucesso.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
