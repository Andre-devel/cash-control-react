import { useQuery } from '@tanstack/react-query'
import { getBackendVersion } from '@/features/version/api'

export function useBackendVersion() {
  return useQuery({
    queryKey: ['version', 'backend'],
    queryFn: getBackendVersion,
    staleTime: 300_000,
    retry: false,
  })
}
