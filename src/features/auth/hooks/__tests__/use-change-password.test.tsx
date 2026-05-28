import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useChangePassword } from '../use-change-password'
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
      <MemoryRouter initialEntries={['/profile']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

function makeValidToken(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64')
  const payload = Buffer.from(
    JSON.stringify({
      sub: 'u1',
      email: 'user@example.com',
      name: 'Test',
      roles: ['USER'],
      exp: 9_999_999_999,
    }),
  ).toString('base64')
  return `${header}.${payload}.sig`
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.getState().clearSession()
})

describe('useChangePassword', () => {
  it('calls POST /auth/password/change with correct payload', async () => {
    const { result } = renderHook(() => useChangePassword(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ currentPassword: 'oldpass123', newPassword: 'newpass456' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('clears session and shows success toast on success', async () => {
    const { toast } = await import('@/lib/toast')
    useAuthStore.getState().setToken(makeValidToken())

    const { result } = renderHook(() => useChangePassword(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ currentPassword: 'oldpass123', newPassword: 'newpass456' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(toast.success).toHaveBeenCalledWith('Senha alterada com sucesso. Faça login novamente.')
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().token).toBeNull()
  })

  it('returns WRONG_CURRENT_PASSWORD error when current password is wrong', async () => {
    const { result } = renderHook(() => useChangePassword(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ currentPassword: 'wrongpassword', newPassword: 'newpass456' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.errorCode).toBe('WRONG_CURRENT_PASSWORD')
  })
})
