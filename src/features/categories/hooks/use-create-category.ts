import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCategory } from '@/features/categories/api/categories.api'
import { toast } from '@/lib/toast'
import { CATEGORIES_QUERY_KEY } from './use-categories'
import type { CreateCategoryRequest, Category } from '@/features/categories/types'
import type { NormalizedError } from '@/features/auth/types'

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation<Category, NormalizedError, CreateCategoryRequest>({
    mutationFn: createCategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
      toast.success('Category created successfully.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
