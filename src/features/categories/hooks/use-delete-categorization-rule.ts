import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteCategorizationRule } from '@/features/categories/api/categories.api'
import { toast } from '@/lib/toast'
import { CATEGORIZATION_RULES_QUERY_KEY } from './use-categorization-rules'
import type { NormalizedError } from '@/features/auth/types'

export function useDeleteCategorizationRule() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, string>({
    mutationFn: deleteCategorizationRule,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIZATION_RULES_QUERY_KEY })
      toast.success('Rule deleted.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
