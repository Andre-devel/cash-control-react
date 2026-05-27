import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useDeleteRole } from '../use-delete-role'
import { roleKeys } from '@/features/roles/api'
import { MOCK_ROLE } from '@/test/handlers/roles.handlers'

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

describe('useDeleteRole', () => {
  it('resolves and shows success toast on successful delete', async () => {
    const { toast } = await import('@/lib/toast')
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useDeleteRole(), { wrapper })

    act(() => {
      result.current.mutate(MOCK_ROLE.id)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Role deleted successfully.')
  })

  it('invalidates roleKeys.lists() on success', async () => {
    const { wrapper, queryClient } = makeWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useDeleteRole(), { wrapper })

    act(() => {
      result.current.mutate(MOCK_ROLE.id)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: roleKeys.lists() })
  })

  it('shows conflict toast on 409 without rethrowing', async () => {
    const { toast } = await import('@/lib/toast')
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useDeleteRole(), { wrapper })

    act(() => {
      result.current.mutate('role-in-use')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith(
      'Role is still assigned to users — remove all assignments first.',
    )
  })

  it('calls onSuccess callback on success', async () => {
    const onSuccess = vi.fn()
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useDeleteRole({ onSuccess }), { wrapper })

    act(() => {
      result.current.mutate(MOCK_ROLE.id)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('shows error toast for non-409 API failures', async () => {
    const { toast } = await import('@/lib/toast')
    const { http, HttpResponse } = await import('msw')
    const { server } = await import('@/test/msw/server')
    server.use(
      http.delete('*/roles/:roleId', () =>
        HttpResponse.json(
          { errorCode: 'SERVER_ERROR', message: 'Delete failed.', correlationId: 'id' },
          { status: 500 },
        ),
      ),
    )
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useDeleteRole(), { wrapper })

    act(() => {
      result.current.mutate(MOCK_ROLE.id)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Delete failed.')
  })

  it('shows error toast on 403 forbidden', async () => {
    const { toast } = await import('@/lib/toast')
    const { http, HttpResponse } = await import('msw')
    const { server } = await import('@/test/msw/server')
    server.use(
      http.delete('*/roles/:roleId', () =>
        HttpResponse.json(
          { errorCode: 'FORBIDDEN', message: 'Cannot delete this role.', correlationId: 'id' },
          { status: 403 },
        ),
      ),
    )
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useDeleteRole(), { wrapper })

    act(() => {
      result.current.mutate(MOCK_ROLE.id)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Cannot delete this role.')
  })
})
