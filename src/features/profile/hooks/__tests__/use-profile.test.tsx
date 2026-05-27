import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { MOCK_PROFILE } from '@/test/msw/handlers'
import { useProfile } from '../use-profile'

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn() },
  LOG_EVENTS: {},
}))

function Wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useProfile', () => {
  it('returns the authenticated user profile data', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(MOCK_PROFILE)
  })

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useProfile(), { wrapper: Wrapper })
    expect(result.current.isLoading).toBe(true)
  })

  it('transitions to error state on API failure', async () => {
    server.use(
      http.get('*/users/me', () =>
        HttpResponse.json(
          { errorCode: 'UNAUTHORIZED', message: 'Not authenticated.', correlationId: 'test-id' },
          { status: 401 },
        ),
      ),
    )

    const { result } = renderHook(() => useProfile(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
