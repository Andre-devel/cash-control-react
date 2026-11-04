import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  dismissRecurrenceSuggestion,
  listRecurrenceSuggestions,
} from '@/features/recurrences/api/recurrences.api'
import { reportMutationError } from '@/lib/form-errors'
import { DASHBOARD_QUERY_KEY } from '@/lib/invalidate-financial-queries'
import type { NormalizedError } from '@/features/auth/types'
import type { RecurrenceSuggestion } from '@/features/recurrences/types'
import { RECURRENCES_QUERY_KEY } from './use-recurrences'

/** Sob a chave das recorrências: criar uma regra invalida a lista e a sugestão some. */
export const RECURRENCE_SUGGESTIONS_QUERY_KEY = [...RECURRENCES_QUERY_KEY, 'suggestions'] as const

export function useRecurrenceSuggestions() {
  return useQuery({
    queryKey: RECURRENCE_SUGGESTIONS_QUERY_KEY,
    queryFn: listRecurrenceSuggestions,
  })
}

export function useDismissRecurrenceSuggestion() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, string>({
    mutationFn: dismissRecurrenceSuggestion,
    onSuccess: (_data, pattern) => {
      queryClient.setQueryData<RecurrenceSuggestion[]>(
        RECURRENCE_SUGGESTIONS_QUERY_KEY,
        (current) => current?.filter((s) => s.pattern !== pattern),
      )
      // O card de assinaturas soma as sugestões não recusadas.
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY })
    },
    onError: (error) => reportMutationError(error),
  })
}
