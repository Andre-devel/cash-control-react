import { useQuery } from '@tanstack/react-query'
import { suggestCategory } from '@/features/categories/api/categories.api'
import { useDebounce } from '@/hooks/use-debounce'
import type { Category } from '@/features/categories/types'

const MIN_DESCRIPTION_LENGTH = 3
const DEBOUNCE_MS = 400

export function useSuggestCategory(description: string | undefined) {
  const debouncedDescription = useDebounce(description ?? '', DEBOUNCE_MS)
  const enabled = debouncedDescription.trim().length >= MIN_DESCRIPTION_LENGTH

  return useQuery<Category | null>({
    queryKey: ['categories', 'suggest', debouncedDescription],
    queryFn: () => suggestCategory(debouncedDescription),
    enabled,
    staleTime: 30_000,
  })
}
