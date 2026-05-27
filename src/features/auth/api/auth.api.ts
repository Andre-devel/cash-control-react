import { axiosInstance } from '@/services/http'
import type { LoginFormValues } from '@/features/auth/schemas/login.schema'
import type { RegisterFormValues } from '@/features/auth/schemas/register.schema'

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresInSeconds: number
}

export interface RegisterResponse {
  token?: string
}

export async function loginApi(
  data: Pick<LoginFormValues, 'email' | 'password'>,
): Promise<LoginResponse> {
  const response = await axiosInstance.post<LoginResponse>('/auth/login', data)
  return response.data
}

export async function registerApi(
  data: Omit<RegisterFormValues, 'confirmPassword'>,
): Promise<RegisterResponse> {
  const response = await axiosInstance.post<RegisterResponse>('/auth/register', data)
  return response.data
}
