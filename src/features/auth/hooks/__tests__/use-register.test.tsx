import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { useRegister } from '../use-register'
import { useAuthStore } from '@/features/auth/store/auth.store'

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
        return HttpResponse.json({ message: 'Check your email.' }, { status: 201 })
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

  it('shows success toast with the message from API and does not set token', async () => {
    const { toast } = await import('@/lib/toast')
    server.use(
      http.post('*/auth/register', () =>
        HttpResponse.json(
          { message: 'Conta criada! Verifique seu e-mail para ativar.' },
          { status: 201 },
        ),
      ),
    )

    const { result } = renderHook(() => useRegister(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate(validData)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(toast.success).toHaveBeenCalledWith('Conta criada! Verifique seu e-mail para ativar.')
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().token).toBeNull()
  })

  it('does not set token on successful registration', async () => {
    const { result } = renderHook(() => useRegister(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate(validData)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('does not set user on successful registration', async () => {
    const { result } = renderHook(() => useRegister(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate(validData)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(useAuthStore.getState().user).toBeNull()
  })
})
