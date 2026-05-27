import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useRegister } from '../use-register'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { MOCK_TOKEN } from '@/test/msw/handlers'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
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
      <MemoryRouter initialEntries={['/register']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

const validData = {
  name: 'Test User',
  email: 'newuser@example.com',
  password: 'password123',
  confirmPassword: 'password123',
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.getState().clearSession()
})

describe('use-register', () => {
  it('fires the correct endpoint and strips confirmPassword', async () => {
    let capturedBody: unknown = null
    server.use(
      http.post('*/auth/register', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({}, { status: 201 })
      }),
    )

    const { result } = renderHook(() => useRegister(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate(validData)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(capturedBody).toMatchObject({ name: 'Test User', email: 'newuser@example.com' })
    expect(capturedBody).not.toHaveProperty('confirmPassword')
  })

  it('shows success toast and does not set token when API returns no token', async () => {
    const { toast } = await import('@/lib/toast')
    const { result } = renderHook(() => useRegister(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate(validData)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(toast.success).toHaveBeenCalledWith('Account created! Please sign in.')
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('stores token when API returns one on registration', async () => {
    server.use(
      http.post('*/auth/register', () => HttpResponse.json({ token: MOCK_TOKEN }, { status: 201 })),
    )

    const { result } = renderHook(() => useRegister(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate(validData)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(useAuthStore.getState().token).toBe(MOCK_TOKEN)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('falls back to empty strings when JWT payload fields are missing on registration', async () => {
    const minimalToken = [
      Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64'),
      Buffer.from(JSON.stringify({ exp: 9_999_999_999 })).toString('base64'),
      'sig',
    ].join('.')

    server.use(
      http.post('*/auth/register', () =>
        HttpResponse.json({ token: minimalToken }, { status: 201 }),
      ),
    )

    const { result } = renderHook(() => useRegister(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate(validData)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const user = useAuthStore.getState().user
    expect(user?.id).toBe('')
    expect(user?.email).toBe('')
    expect(user?.name).toBe('')
    expect(user?.roles).toEqual([])
  })
})
