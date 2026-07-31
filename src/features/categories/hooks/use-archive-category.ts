import { useMutation, useQueryClient } from '@tanstack/react-query'
import { archiveCategory } from '@/features/categories/api/categories.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { CATEGORIES_QUERY_KEY } from './use-categories'
import type { NormalizedError } from '@/features/auth/types'

export function useArchiveCategory() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, string>({
    mutationFn: archiveCategory,
    onSuccess: () => {
      invalidateFinancialQueries(queryClient, [CATEGORIES_QUERY_KEY])
      toast.success('Categoria arquivada.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
