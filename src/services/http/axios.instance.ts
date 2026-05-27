import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { logger, LOG_EVENTS } from '@/lib/logger'
import type { NormalizedError } from '@/features/auth/types'

const REQUEST_TIMEOUT_MS = 15_000

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Lazy import to avoid circular dependency: auth store → axios → auth store
function getAuthStore() {
  // Dynamic import at call-time to break the initialization cycle
  return import('@/features/auth/store/auth.store').then((m) => m.useAuthStore.getState())
}

// De-duplication flag for concurrent 401 responses
let isHandling401 = false

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const store = await getAuthStore()
    const { token } = store
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config
  },
  (error: unknown) => Promise.reject(error),
)

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const normalized = normalizeError(error)

    if (normalized.status === 401 && !isHandling401) {
      isHandling401 = true
      try {
        await handle401()
      } finally {
        // Reset after redirect completes so the flag doesn't stick
        setTimeout(() => {
          isHandling401 = false
        }, 0)
      }
    }

    return Promise.reject(normalized)
  },
)

async function handle401(): Promise<void> {
  logger.log({ event: LOG_EVENTS.SESSION_EXPIRED })

  const { clearSession } = await getAuthStore()
  clearSession()

  // Import lazily to avoid circular dependency
  const { queryClient } = await import('@/app/providers/query-provider')
  queryClient.clear()

  // Import lazily to avoid circular dependency with router
  const { router } = await import('@/app/router/router')
  router.navigate('/login', { replace: true })

  const { toast } = await import('@/lib/toast')
  toast.warn('Your session has expired. Please sign in again.')
}

export function normalizeError(error: AxiosError): NormalizedError {
  const status = error.response?.status ?? 0
  const data = error.response?.data as Record<string, unknown> | undefined
  const path = (error.config?.url as string | undefined) ?? ''

  return {
    status,
    errorCode: typeof data?.errorCode === 'string' ? data.errorCode : 'UNKNOWN_ERROR',
    message: typeof data?.message === 'string' ? data.message : 'An unexpected error occurred.',
    correlationId:
      typeof data?.correlationId === 'string' ? data.correlationId : crypto.randomUUID(),
    path,
  }
}
