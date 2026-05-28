import { describe, it, expect } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { useVerifyEmail } from '../use-verify-email'

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

describe('useVerifyEmail', () => {
  it('calls GET /auth/email/verify?token= and returns message on success', async () => {
    server.use(
      http.get('*/auth/email/verify', () =>
        HttpResponse.json({ message: 'Email verified successfully.' }),
      ),
    )

    const { result } = renderHook(() => useVerifyEmail(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate('valid-token')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.message).toBe('Email verified successfully.')
  })

  it('sets isError when token is expired', async () => {
    const { result } = renderHook(() => useVerifyEmail(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate('expired-token')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.errorCode).toBe('TOKEN_EXPIRED')
  })
})
