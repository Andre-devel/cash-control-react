import { describe, it, expect } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useForgotPassword } from '../use-forgot-password'

function Wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('useForgotPassword', () => {
  it('calls POST /auth/password-reset/request and always succeeds', async () => {
    const { result } = renderHook(() => useForgotPassword(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate('test@example.com')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.message).toBeTruthy()
  })

  it('always returns success regardless of whether email exists (anti-enumeration)', async () => {
    const { result } = renderHook(() => useForgotPassword(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate('nonexistent@example.com')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
