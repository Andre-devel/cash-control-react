import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { createTestQueryClient } from '@/test/utils'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useRoles } from '../use-roles'
import { MOCK_PAGINATED_ROLES } from '@/test/handlers/roles.handlers'

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useRoles', () => {
  it('fetches and returns paginated roles', async () => {
    const { result } = renderHook(() => useRoles({ page: 0, size: 20 }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.content).toHaveLength(MOCK_PAGINATED_ROLES.content.length)
    expect(result.current.data?.totalElements).toBe(MOCK_PAGINATED_ROLES.totalElements)
  })

  it('exposes isLoading, isError, and data', async () => {
    const { result } = renderHook(() => useRoles({ page: 0, size: 20 }), { wrapper })
    expect(result.current.isLoading).toBeDefined()
    expect(result.current.isError).toBeDefined()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })

  it('sets isError on API failure', async () => {
    server.use(
      http.get('*/roles', () => HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 })),
    )
    const { result } = renderHook(() => useRoles({ page: 0, size: 20 }), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('uses correct query key including params', async () => {
    let capturedUrl = ''
    server.use(
      http.get('*/roles', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(MOCK_PAGINATED_ROLES)
      }),
    )
    const { result } = renderHook(() => useRoles({ page: 1, size: 10 }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const url = new URL(capturedUrl)
    expect(url.searchParams.get('page')).toBe('1')
    expect(url.searchParams.get('size')).toBe('10')
  })
})
