import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCategory } from '@/features/categories/api/categories.api'
import { toast } from '@/lib/toast'
import { reportMutationError } from '@/lib/form-errors'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { CATEGORIES_QUERY_KEY } from './use-categories'
import type { CreateCategoryRequest, Category } from '@/features/categories/types'
import type { NormalizedError } from '@/features/auth/types'

interface UseCreateCategoryOptions {
  onFieldError?: (error: NormalizedError) => void
}

export function useCreateCategory(options?: UseCreateCategoryOptions) {
  const queryClient = useQueryClient()

  return useMutation<Category, NormalizedError, CreateCategoryRequest>({
    mutationFn: createCategory,
    onSuccess: () => {
      invalidateFinancialQueries(queryClient, [CATEGORIES_QUERY_KEY])
      toast.success('Categoria criada com sucesso.')
    },
    onError: (error) => reportMutationError(error, options?.onFieldError),
  })
}
