import { useQuery } from '@tanstack/react-query'
import { listCategories } from '@/features/categories/api/categories.api'
import type { ListCategoriesParams } from '@/features/categories/types'

export const CATEGORIES_QUERY_KEY = ['categories'] as const

export function useCategories(params?: ListCategoriesParams) {
  return useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, params],
    queryFn: () => listCategories(params),
  })
}
