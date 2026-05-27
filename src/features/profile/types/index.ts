export interface UserProfile {
  id: string
  name: string
  email: string
  preferences: Record<string, unknown>
  createdAt: string
}

export interface ConsentRecord {
  id: string
  type: string
  status: string
  date: string
}

export interface UpdateProfileRequest {
  name: string
  preferences?: Record<string, unknown>
}
