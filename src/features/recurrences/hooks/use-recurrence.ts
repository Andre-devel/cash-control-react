import { useQuery } from '@tanstack/react-query'
import { getRecurrence } from '@/features/recurrences/api/recurrences.api'
import { RECURRENCES_QUERY_KEY } from './use-recurrences'

export function useRecurrence(id: string) {
  return useQuery({
    queryKey: [...RECURRENCES_QUERY_KEY, id],
    queryFn: () => getRecurrence(id),
    enabled: !!id,
  })
}
