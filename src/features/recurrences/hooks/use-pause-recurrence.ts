import { useMutation, useQueryClient } from '@tanstack/react-query'
import { pauseRecurrence } from '@/features/recurrences/api/recurrences.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
import { RECURRENCES_QUERY_KEY } from './use-recurrences'
import type { NormalizedError } from '@/features/auth/types'

export interface PauseRecurrenceVariables {
  id: string
  resumeAt?: string
}

export function usePauseRecurrence() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, PauseRecurrenceVariables>({
    mutationFn: ({ id, resumeAt }) => pauseRecurrence(id, resumeAt ? { resumeAt } : undefined),
    onSuccess: () => {
      invalidateFinancialQueries(queryClient, [RECURRENCES_QUERY_KEY, TRANSACTIONS_QUERY_KEY])
      toast.success('Recorrência pausada.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
