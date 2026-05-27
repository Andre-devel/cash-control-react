import { axiosInstance } from '@/services/http'
import type { UserProfile, ConsentRecord, UpdateProfileRequest } from '@/features/profile/types'

export async function getProfile(): Promise<UserProfile> {
  const response = await axiosInstance.get<UserProfile>('/users/me')
  return response.data
}

export async function updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
  const response = await axiosInstance.put<UserProfile>('/users/me', data)
  return response.data
}

export async function getConsentHistory(): Promise<ConsentRecord[]> {
  const response = await axiosInstance.get<ConsentRecord[]>('/users/me/consents')
  return response.data
}
