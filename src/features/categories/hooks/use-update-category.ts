import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCategory } from '@/features/categories/api/categories.api'
import { toast } from '@/lib/toast'
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
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
      toast.success('Category updated successfully.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
