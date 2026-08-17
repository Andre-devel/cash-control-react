import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

const clearSession = vi.fn()
const setToken = vi.fn()
const requestTokenRefresh = vi.fn()

vi.mock('@/features/auth/store/auth.store', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      token: 'expired-access-token',
      clearSession,
      setToken,
    })),
  },
}))

vi.mock('../refresh-client', () => ({
  requestTokenRefresh: () => requestTokenRefresh() as Promise<string>,
}))

vi.mock('@/app/providers/query-provider', () => ({
  queryClient: { clear: vi.fn() },
}))

vi.mock('@/app/router/router', () => ({
  router: { navigate: vi.fn() },
}))

vi.mock('@/lib/toast', () => ({
  toast: { warn: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn() },
  LOG_EVENTS: {
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    SESSION_REFRESHED: 'SESSION_REFRESHED',
  },
}))

function unauthorized(config: InternalAxiosRequestConfig): Promise<never> {
  return Promise.reject({
    isAxiosError: true,
    name: 'AxiosError',
    message: 'Request failed with status code 401',
    config,
    response: {
      status: 401,
      data: { errorCode: 'UNAUTHORIZED', message: 'Token expirado' },
    },
  } as unknown as AxiosError)
}

function ok(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  return Promise.resolve({
    data: { ok: true },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  } as AxiosResponse)
}

/** Fails with 401 the first `failures` times, then succeeds. */
function adapterFailingTimes(failures: number) {
  let calls = 0
  return (config: InternalAxiosRequestConfig) => {
    calls += 1
    return calls <= failures ? unauthorized(config) : ok(config)
  }
}

async function settle() {
  for (let i = 0; i < 5; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

beforeEach(async () => {
  vi.clearAllMocks()
  requestTokenRefresh.mockReset()
  requestTokenRefresh.mockResolvedValue('fresh-access-token')
  // The interceptor keeps module-level state; let the previous test's
  // session-ended guard clear itself before the next one runs.
  await settle()
})

describe('reactive token refresh', () => {
  it('refreshes and replays the original request after a 401', async () => {
    const { axiosInstance } = await import('../axios.instance')

    const response = await axiosInstance.get('/transactions', {
      adapter: adapterFailingTimes(1),
    })

    expect(requestTokenRefresh).toHaveBeenCalledTimes(1)
    expect(setToken).toHaveBeenCalledWith('fresh-access-token')
    expect(response.status).toBe(200)
    expect(clearSession).not.toHaveBeenCalled()
  })

  it('ends the session when the refresh itself fails', async () => {
    requestTokenRefresh.mockRejectedValue(new Error('refresh cookie expired'))
    const { axiosInstance } = await import('../axios.instance')
    const { router } = await import('@/app/router/router')
    const { toast } = await import('@/lib/toast')

    await expect(
      axiosInstance.get('/transactions', { adapter: adapterFailingTimes(Infinity) }),
    ).rejects.toMatchObject({ status: 401 })
    await settle()

    expect(clearSession).toHaveBeenCalled()
    expect(router.navigate).toHaveBeenCalledWith('/login', { replace: true })
    expect(toast.warn).toHaveBeenCalled()
  })

  it('does not retry twice when the replayed request is also rejected', async () => {
    const { axiosInstance } = await import('../axios.instance')

    await expect(
      axiosInstance.get('/transactions', { adapter: adapterFailingTimes(Infinity) }),
    ).rejects.toMatchObject({ status: 401 })
    await settle()

    expect(requestTokenRefresh).toHaveBeenCalledTimes(1)
    expect(clearSession).toHaveBeenCalled()
  })

  it('collapses concurrent renewals onto a single refresh request', async () => {
    const { refreshAccessToken } = await import('../axios.instance')

    let releaseRefresh: (token: string) => void = () => {}
    requestTokenRefresh.mockReturnValue(
      new Promise<string>((resolve) => {
        releaseRefresh = resolve
      }),
    )

    const renewals = [refreshAccessToken(), refreshAccessToken(), refreshAccessToken()]
    releaseRefresh('fresh-access-token')

    expect(await Promise.all(renewals)).toEqual([
      'fresh-access-token',
      'fresh-access-token',
      'fresh-access-token',
    ])
    expect(requestTokenRefresh).toHaveBeenCalledTimes(1)
    expect(setToken).toHaveBeenCalledTimes(1)
  })

  it('leaves a 401 from /auth/login alone', async () => {
    const { axiosInstance } = await import('../axios.instance')

    await expect(
      axiosInstance.post('/auth/login', {}, { adapter: adapterFailingTimes(Infinity) }),
    ).rejects.toMatchObject({ status: 401 })
    await settle()

    expect(requestTokenRefresh).not.toHaveBeenCalled()
    expect(clearSession).not.toHaveBeenCalled()
  })
})
