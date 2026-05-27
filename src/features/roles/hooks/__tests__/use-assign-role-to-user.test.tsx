import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useAssignRoleToUser } from '../use-assign-role-to-user'

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

describe('useAssignRoleToUser', () => {
  it('resolves and shows success toast', async () => {
    const { toast } = await import('@/lib/toast')
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useAssignRoleToUser(), { wrapper })

    act(() => {
      result.current.mutate({ userId: 'user-1', roleId: 'role-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Role assigned to user.')
  })

  it('invalidates user query keys on success', async () => {
    const { wrapper, queryClient } = makeWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useAssignRoleToUser(), { wrapper })

    act(() => {
      result.current.mutate({ userId: 'user-42', roleId: 'role-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['users', 'detail', 'user-42'],
    })
  })

  it('shows conflict toast on 409', async () => {
    const { toast } = await import('@/lib/toast')
    const { http, HttpResponse } = await import('msw')
    const { server } = await import('@/test/msw/server')
    server.use(
      http.post('*/users/:userId/roles', () =>
        HttpResponse.json(
          {
            errorCode: 'ROLE_ALREADY_ASSIGNED',
            message: 'An unexpected error occurred.',
            correlationId: 'test-id',
          },
          { status: 409 },
        ),
      ),
    )
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useAssignRoleToUser(), { wrapper })

    act(() => {
      result.current.mutate({ userId: 'user-1', roleId: 'role-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Role already assigned to this user.')
  })

  it('shows error toast with message for non-409 errors', async () => {
    const { toast } = await import('@/lib/toast')
    const { http, HttpResponse } = await import('msw')
    const { server } = await import('@/test/msw/server')
    server.use(
      http.post('*/users/:userId/roles', () =>
        HttpResponse.json(
          { errorCode: 'SERVER_ERROR', message: 'Assign role failed.', correlationId: 'id' },
          { status: 500 },
        ),
      ),
    )
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useAssignRoleToUser(), { wrapper })

    act(() => {
      result.current.mutate({ userId: 'user-1', roleId: 'role-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Assign role failed.')
  })

  it('calls onSuccess callback when provided', async () => {
    const onSuccess = vi.fn()
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useAssignRoleToUser({ onSuccess }), { wrapper })

    act(() => {
      result.current.mutate({ userId: 'user-1', roleId: 'role-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })
})
