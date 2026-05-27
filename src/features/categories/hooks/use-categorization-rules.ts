import { useQuery } from '@tanstack/react-query'
import { listCategorizationRules } from '@/features/categories/api/categories.api'

export const CATEGORIZATION_RULES_QUERY_KEY = ['categories', 'rules'] as const

export function useCategorizationRules() {
  return useQuery({
    queryKey: CATEGORIZATION_RULES_QUERY_KEY,
    queryFn: listCategorizationRules,
  })
}
