import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCategory } from '@/features/categories/api/categories.api'
import { toast } from '@/lib/toast'
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
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
      toast.success('Category created successfully.')
    },
    onError: (error) => {
      if ((error.status === 409 || error.status === 422) && options?.onFieldError) {
        options.onFieldError(error)
        return
      }
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
