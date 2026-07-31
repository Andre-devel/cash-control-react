import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCategory } from '@/features/categories/api/categories.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { CATEGORIES_QUERY_KEY } from './use-categories'
import type { UpdateCategoryRequest, Category } from '@/features/categories/types'
import type { NormalizedError } from '@/features/auth/types'

interface UpdateCategoryVariables {
  id: string
  data: UpdateCategoryRequest
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation<Category, NormalizedError, UpdateCategoryVariables>({
    mutationFn: ({ id, data }) => updateCategory(id, data),
    onSuccess: () => {
      invalidateFinancialQueries(queryClient, [CATEGORIES_QUERY_KEY])
      toast.success('Categoria atualizada com sucesso.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
