import { useMutation, useQueryClient } from '@tanstack/react-query'
import { showCategory } from '@/features/categories/api/categories.api'
import { toast } from '@/lib/toast'
import { CATEGORIES_QUERY_KEY } from './use-categories'
import type { NormalizedError } from '@/features/auth/types'

export function useShowCategory() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, string>({
    mutationFn: showCategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
      toast.success('Category visible.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
