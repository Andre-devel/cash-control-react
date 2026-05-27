import { useQuery } from '@tanstack/react-query'
import { getProfile } from '@/features/profile/api/profile.api'

export const PROFILE_QUERY_KEY = ['profile'] as const

export function useProfile() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getProfile,
  })
}
