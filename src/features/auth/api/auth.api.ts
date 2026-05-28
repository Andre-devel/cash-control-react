import { axiosInstance } from '@/services/http'
import type { LoginFormValues } from '@/features/auth/schemas/login.schema'
import type { RegisterFormValues } from '@/features/auth/schemas/register.schema'
import type { MessageResponse, UserProfileResponse } from '@/features/auth/types'

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresInSeconds: number
}

export type { MessageResponse }

export async function loginApi(
  data: Pick<LoginFormValues, 'email' | 'password'>,
): Promise<LoginResponse> {
  const response = await axiosInstance.post<LoginResponse>('/auth/login', data)
  return response.data
}

export async function registerApi(
  data: Omit<RegisterFormValues, 'confirmPassword'>,
): Promise<MessageResponse> {
  const response = await axiosInstance.post<MessageResponse>('/auth/register', data)
  return response.data
}

export async function logoutApi(): Promise<void> {
  await axiosInstance.post('/auth/logout')
}

export async function getMeApi(): Promise<UserProfileResponse> {
  const response = await axiosInstance.get<UserProfileResponse>('/auth/me')
  return response.data
}

export async function verifyEmailApi(token: string): Promise<MessageResponse> {
  const response = await axiosInstance.get<MessageResponse>('/auth/email/verify', {
    params: { token },
  })
  return response.data
}

export async function resendVerificationApi(email: string): Promise<MessageResponse> {
  const response = await axiosInstance.post<MessageResponse>('/auth/email/verify/resend', { email })
  return response.data
}

export async function forgotPasswordApi(email: string): Promise<MessageResponse> {
  const response = await axiosInstance.post<MessageResponse>('/auth/password-reset/request', {
    email,
  })
  return response.data
}

export async function resetPasswordApi(
  token: string,
  newPassword: string,
): Promise<MessageResponse> {
  const response = await axiosInstance.post<MessageResponse>('/auth/password-reset/confirm', {
    token,
    newPassword,
  })
  return response.data
}

export async function changePasswordApi(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await axiosInstance.post('/auth/password/change', { currentPassword, newPassword })
}
