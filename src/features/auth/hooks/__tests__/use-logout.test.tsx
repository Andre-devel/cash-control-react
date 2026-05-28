import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { useLogout } from '../use-logout'
import { useAuthStore } from '@/features/auth/store/auth.store'

vi.mock('@/styles/theme/dark-mode', () => ({
  applyTheme: vi.fn(),
  resolveTheme: vi.fn((t: string) => (t === 'dark' ? 'dark' : 'light')),
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

vi.mock('@/app/providers/query-provider', () => ({
  queryClient: { clear: vi.fn() },
}))

function Wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.getState().clearSession()
})

describe('use-logout', () => {
  it('clears the auth store on logout', () => {
    useAuthStore.getState().setToken('test-token')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    const { result } = renderHook(() => useLogout(), { wrapper: Wrapper })

    act(() => {
      result.current()
    })

    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('calls queryClient.clear() on logout', async () => {
    const { queryClient } = await import('@/app/providers/query-provider')
    const { result } = renderHook(() => useLogout(), { wrapper: Wrapper })

    act(() => {
      result.current()
    })

    expect(queryClient.clear).toHaveBeenCalled()
  })

  it('calls POST /auth/logout API', async () => {
    let logoutCalled = false
    server.use(
      http.post('*/auth/logout', () => {
        logoutCalled = true
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const { result } = renderHook(() => useLogout(), { wrapper: Wrapper })

    act(() => {
      result.current()
    })

    await waitFor(() => {
      expect(logoutCalled).toBe(true)
    })
  })

  it('still clears session even if logout API fails', async () => {
    server.use(http.post('*/auth/logout', () => HttpResponse.error()))

    useAuthStore.getState().setToken('test-token')
    const { result } = renderHook(() => useLogout(), { wrapper: Wrapper })

    act(() => {
      result.current()
    })

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().token).toBeNull()
  })
})
