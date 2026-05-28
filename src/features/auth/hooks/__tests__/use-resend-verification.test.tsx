import { describe, it, expect } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useResendVerification } from '../use-resend-verification'

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

describe('useResendVerification', () => {
  it('calls POST /auth/email/verify/resend and succeeds', async () => {
    const { result } = renderHook(() => useResendVerification(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate('test@example.com')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.message).toBeTruthy()
  })

  it('always succeeds for anti-enumeration (even unknown emails)', async () => {
    const { result } = renderHook(() => useResendVerification(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate('unknown@example.com')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
