import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useAssignPermissionToRole } from '../use-assign-permission-to-role'
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

describe('useAssignPermissionToRole', () => {
  it('resolves and shows success toast', async () => {
    const { toast } = await import('@/lib/toast')
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useAssignPermissionToRole(), { wrapper })

    act(() => {
      result.current.mutate({ roleId: MOCK_ROLE.id, permissionId: 'perm-new' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Permission assigned to role.')
  })

  it('invalidates roleKeys.detail(roleId) on success', async () => {
    const { wrapper, queryClient } = makeWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useAssignPermissionToRole(), { wrapper })

    act(() => {
      result.current.mutate({ roleId: MOCK_ROLE.id, permissionId: 'perm-new' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: roleKeys.detail(MOCK_ROLE.id) })
  })

  it('shows conflict toast on 409 without closing', async () => {
    const { toast } = await import('@/lib/toast')
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useAssignPermissionToRole(), { wrapper })

    act(() => {
      result.current.mutate({ roleId: MOCK_ROLE.id, permissionId: 'perm-already-assigned' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Permission already assigned to this role.')
  })

  it('shows error toast with message for non-409 errors', async () => {
    const { toast } = await import('@/lib/toast')
    const { http, HttpResponse } = await import('msw')
    const { server } = await import('@/test/msw/server')
    server.use(
      http.post('*/roles/:roleId/permissions', () =>
        HttpResponse.json(
          { errorCode: 'SERVER_ERROR', message: 'Assign permission failed.', correlationId: 'id' },
          { status: 500 },
        ),
      ),
    )
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useAssignPermissionToRole(), { wrapper })

    act(() => {
      result.current.mutate({ roleId: MOCK_ROLE.id, permissionId: 'perm-new' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Assign permission failed.')
  })

  it('calls onSuccess callback when provided', async () => {
    const onSuccess = vi.fn()
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useAssignPermissionToRole({ onSuccess }), { wrapper })

    act(() => {
      result.current.mutate({ roleId: MOCK_ROLE.id, permissionId: 'perm-new' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })
})
