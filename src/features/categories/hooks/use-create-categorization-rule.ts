import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCategorizationRule } from '@/features/categories/api/categories.api'
import { toast } from '@/lib/toast'
import { CATEGORIZATION_RULES_QUERY_KEY } from './use-categorization-rules'
import type {
  CreateCategorizationRuleRequest,
  CategorizationRule,
} from '@/features/categories/types'
import type { NormalizedError } from '@/features/auth/types'

export function useCreateCategorizationRule() {
  const queryClient = useQueryClient()

  return useMutation<CategorizationRule, NormalizedError, CreateCategorizationRuleRequest>({
    mutationFn: createCategorizationRule,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIZATION_RULES_QUERY_KEY })
      toast.success('Rule created successfully.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
