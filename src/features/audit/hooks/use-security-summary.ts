import { useQuery } from '@tanstack/react-query'
import { getSecuritySummary } from '@/features/audit/api/audit.api'

export function useSecuritySummary() {
  return useQuery({
    queryKey: ['audit', 'summary'],
    queryFn: getSecuritySummary,
    staleTime: 60_000,
  })
}
