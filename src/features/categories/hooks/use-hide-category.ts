import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hideCategory } from '@/features/categories/api/categories.api'
import { toast } from '@/lib/toast'
import { CATEGORIES_QUERY_KEY } from './use-categories'
import type { NormalizedError } from '@/features/auth/types'

export function useHideCategory() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, string>({
    mutationFn: hideCategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
      toast.success('Category hidden.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
