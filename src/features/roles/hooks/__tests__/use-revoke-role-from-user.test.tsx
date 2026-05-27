import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useRevokeRoleFromUser } from '../use-revoke-role-from-user'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

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

describe('useRevokeRoleFromUser', () => {
  it('resolves and shows success toast', async () => {
    const { toast } = await import('@/lib/toast')
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useRevokeRoleFromUser(), { wrapper })

    act(() => {
      result.current.mutate({ userId: 'user-1', roleId: 'role-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Role removed from user.')
  })

  it('invalidates user query keys on success', async () => {
    const { wrapper, queryClient } = makeWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useRevokeRoleFromUser(), { wrapper })

    act(() => {
      result.current.mutate({ userId: 'user-42', roleId: 'role-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['users', 'detail', 'user-42'],
    })
  })

  it('shows error toast on API failure', async () => {
    const { toast } = await import('@/lib/toast')
    const { http, HttpResponse } = await import('msw')
    const { server } = await import('@/test/msw/server')
    server.use(
      http.delete('*/users/:userId/roles/:roleId', () =>
        HttpResponse.json(
          { errorCode: 'SERVER_ERROR', message: 'Something went wrong.', correlationId: 'id' },
          { status: 500 },
        ),
      ),
    )
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useRevokeRoleFromUser(), { wrapper })

    act(() => {
      result.current.mutate({ userId: 'user-1', roleId: 'role-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Something went wrong.')
  })
})
