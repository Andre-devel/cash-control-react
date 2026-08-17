import axios from 'axios'

/**
 * Deliberately interceptor-free: the shared instance retries on 401 by calling
 * refresh, so refreshing through it would recurse.
 */
const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 15_000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

interface RefreshResponse {
  accessToken: string
  tokenType: string
  expiresInSeconds: number
}

/** Exchanges the httpOnly refresh cookie for a new access token. */
export async function requestTokenRefresh(): Promise<string> {
  const response = await refreshClient.post<RefreshResponse>('/auth/refresh')
  return response.data.accessToken
}
