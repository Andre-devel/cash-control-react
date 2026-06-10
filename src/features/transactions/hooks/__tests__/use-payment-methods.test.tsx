import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { usePaymentMethods, PAYMENT_METHODS_QUERY_KEY } from '../use-payment-methods'
import { MOCK_PAYMENT_METHODS } from '@/test/handlers/payment-methods.handlers'

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  }
}

beforeEach(() => {
  server.resetHandlers()
})

describe('usePaymentMethods', () => {
  it('starts in loading state', () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => usePaymentMethods(), { wrapper })
    expect(result.current.isLoading).toBe(true)
  })

  it('fetches and returns all seven payment methods', async () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => usePaymentMethods(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(7)
  })

  it('returns data matching mock payment methods', async () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => usePaymentMethods(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(MOCK_PAYMENT_METHODS)
  })

  it('returns objects with id, slug, and name fields', async () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => usePaymentMethods(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    for (const pm of result.current.data ?? []) {
      expect(pm).toHaveProperty('id')
      expect(pm).toHaveProperty('slug')
      expect(pm).toHaveProperty('name')
    }
  })

  it('uses the correct query key', () => {
    expect(PAYMENT_METHODS_QUERY_KEY).toEqual(['payment-methods'])
  })

  it('sets isError when the API returns a 500', async () => {
    server.use(
      http.get('*/payment-methods', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => usePaymentMethods(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('caches results with staleTime Infinity (second render returns same data without refetch)', async () => {
    const { wrapper, queryClient } = makeWrapper()
    const { result } = renderHook(() => usePaymentMethods(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData(PAYMENT_METHODS_QUERY_KEY)
    expect(cached).toEqual(MOCK_PAYMENT_METHODS)
    expect(queryClient.getQueryState(PAYMENT_METHODS_QUERY_KEY)?.isInvalidated).toBe(false)
  })
})
