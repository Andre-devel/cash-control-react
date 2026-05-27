import { useQuery } from '@tanstack/react-query'
import { listRecurrences } from '@/features/recurrences/api/recurrences.api'

export const RECURRENCES_QUERY_KEY = ['recurrences'] as const

export function useRecurrences() {
  return useQuery({
    queryKey: RECURRENCES_QUERY_KEY,
    queryFn: listRecurrences,
  })
}
