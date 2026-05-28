import type { Theme } from '@/styles/theme/dark-mode'

export type UserRole = string

export interface AuthUser {
  id: string
  email: string
  name: string
  roles: UserRole[]
  permissions?: string[]
}

export interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  theme: Theme
}

export interface AuthActions {
  setToken: (token: string) => void
  setUser: (user: AuthUser) => void
  clearSession: () => void
  setTheme: (theme: Theme) => void
}

export type AuthStore = AuthState & AuthActions

export interface ApiErrorResponse {
  errorCode: string
  message: string
  correlationId?: string
}

export interface NormalizedError {
  status: number
  errorCode: string
  message: string
  correlationId: string
  path?: string
}

export interface MessageResponse {
  message: string
}

export interface UserProfileResponse {
  id: string
  email: string
  displayName: string
  status: string
  roles: string[]
  permissions: string[]
  linkedProviders: string[]
  createdAt: string
}
