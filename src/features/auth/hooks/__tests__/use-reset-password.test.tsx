import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useResetPassword } from '../use-reset-password'

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
      <MemoryRouter initialEntries={['/reset-password?token=valid-token']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('useResetPassword', () => {
  it('calls POST /auth/password-reset/confirm and shows success toast', async () => {
    const { toast } = await import('@/lib/toast')
    const { result } = renderHook(() => useResetPassword(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ token: 'valid-token', newPassword: 'newpassword123' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(toast.success).toHaveBeenCalledWith(
      'Senha redefinida com sucesso. Faça login para continuar.',
    )
  })

  it('sets isError when token is expired', async () => {
    const { result } = renderHook(() => useResetPassword(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ token: 'expired-token', newPassword: 'newpassword123' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.errorCode).toBe('TOKEN_EXPIRED')
  })
})
