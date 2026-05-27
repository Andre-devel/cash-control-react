import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { usePermissions } from '../use-permissions'
import { MOCK_PERMISSIONS } from '@/test/handlers/roles.handlers'

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

describe('usePermissions', () => {
  it('fetches and returns all permissions', async () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => usePermissions(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(MOCK_PERMISSIONS.length)
    expect(result.current.data?.[0].id).toBe(MOCK_PERMISSIONS[0].id)
    expect(result.current.data?.[0].name).toBe(MOCK_PERMISSIONS[0].name)
  })

  it('starts in loading state', () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => usePermissions(), { wrapper })

    expect(result.current.isLoading).toBe(true)
  })
})
