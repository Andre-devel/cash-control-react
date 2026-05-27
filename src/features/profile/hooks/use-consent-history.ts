import { useQuery } from '@tanstack/react-query'
import { getConsentHistory } from '@/features/profile/api/profile.api'

export const CONSENT_HISTORY_QUERY_KEY = ['profile', 'consents'] as const

export function useConsentHistory() {
  return useQuery({
    queryKey: CONSENT_HISTORY_QUERY_KEY,
    queryFn: getConsentHistory,
  })
}
