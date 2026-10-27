import type { UserProfileResponse } from '@/features/auth/types'

export type UserProfile = UserProfileResponse

export interface ConsentRecord {
  id: string
  consentVersion: string
  acceptedAt: string
  revokedAt: string | null
  active: boolean
}

export interface UpdateProfileRequest {
  displayName: string
}
