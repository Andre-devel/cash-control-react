import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteRecurrence } from '@/features/recurrences/api/recurrences.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
import { RECURRENCES_QUERY_KEY } from './use-recurrences'
import type { DeleteRecurrenceParams } from '@/features/recurrences/types'
import type { NormalizedError } from '@/features/auth/types'

export function useDeleteRecurrence() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, DeleteRecurrenceParams>({
    mutationFn: ({ id, strategy }) => deleteRecurrence(id, strategy),
    onSuccess: () => {
      invalidateFinancialQueries(queryClient, [RECURRENCES_QUERY_KEY, TRANSACTIONS_QUERY_KEY])
      toast.success('Recorrência excluída.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
