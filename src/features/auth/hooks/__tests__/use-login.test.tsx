import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { useLogin } from '../use-login'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { MOCK_TOKEN } from '@/test/msw/handlers'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn() },
  LOG_EVENTS: {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILURE: 'LOGIN_FAILURE',
    LOGOUT: 'LOGOUT',
    SESSION_RESTORED: 'SESSION_RESTORED',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    UNAUTHORIZED_ROUTE_ACCESS_ATTEMPT: 'UNAUTHORIZED_ROUTE_ACCESS_ATTEMPT',
    FORBIDDEN_ROUTE_ACCESS_ATTEMPT: 'FORBIDDEN_ROUTE_ACCESS_ATTEMPT',
  },
}))

vi.mock('@/styles/theme/dark-mode', () => ({
  applyTheme: vi.fn(),
  resolveTheme: vi.fn((t: string) => (t === 'dark' ? 'dark' : 'light')),
}))

function Wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.getState().clearSession()
})

describe('use-login', () => {
  it('calls POST /auth/login with the correct payload', async () => {
    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ email: 'user@example.com', password: 'password123' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('sets token in auth store on successful login', async () => {
    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ email: 'user@example.com', password: 'password123' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(useAuthStore.getState().token).toBe(MOCK_TOKEN)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('calls toast.error on failed login (401)', async () => {
    const { toast } = await import('@/lib/toast')
    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ email: 'wrong@example.com', password: 'wrongpass' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(toast.error).toHaveBeenCalledWith('Invalid credentials. Please try again.')
  })

  it('does not set token on failed login', async () => {
    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ email: 'wrong@example.com', password: 'wrongpass' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('shows error toast on 429 rate limit response', async () => {
    const { toast } = await import('@/lib/toast')
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json(
          {
            errorCode: 'TOO_MANY_REQUESTS',
            message: 'Too many requests.',
            correlationId: 'test-id',
          },
          { status: 429 },
        ),
      ),
    )

    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ email: 'user@example.com', password: 'password123' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(toast.error).toHaveBeenCalledWith('Invalid credentials. Please try again.')
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('shows error toast on network error', async () => {
    const { toast } = await import('@/lib/toast')
    server.use(http.post('*/auth/login', () => HttpResponse.error()))

    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ email: 'user@example.com', password: 'password123' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(toast.error).toHaveBeenCalledWith('Invalid credentials. Please try again.')
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('falls back to empty strings when JWT payload fields are missing', async () => {
    const minimalToken = [
      Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64'),
      Buffer.from(JSON.stringify({ exp: 9_999_999_999 })).toString('base64'),
      'sig',
    ].join('.')

    server.use(http.post('*/auth/login', () => HttpResponse.json({ token: minimalToken })))

    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ email: 'user@example.com', password: 'password123' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const user = useAuthStore.getState().user
    expect(user?.id).toBe('')
    expect(user?.email).toBe('')
    expect(user?.name).toBe('')
    expect(user?.roles).toEqual([])
  })

  it('stores token without user data when JWT payload cannot be decoded', async () => {
    const malformedToken = [
      Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64'),
      Buffer.from('not-valid-json').toString('base64'),
      'sig',
    ].join('.')

    server.use(http.post('*/auth/login', () => HttpResponse.json({ token: malformedToken })))

    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ email: 'user@example.com', password: 'password123' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(useAuthStore.getState().token).toBe(malformedToken)
    expect(useAuthStore.getState().user).toBeNull()
  })
})
