import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useRevokePermissionFromRole } from '../use-revoke-permission-from-role'
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

describe('useRevokePermissionFromRole', () => {
  it('resolves and shows success toast', async () => {
    const { toast } = await import('@/lib/toast')
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useRevokePermissionFromRole(), { wrapper })

    act(() => {
      result.current.mutate({ roleId: MOCK_ROLE.id, permissionId: 'perm-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Permission removed from role.')
  })

  it('invalidates roleKeys.detail(roleId) on success', async () => {
    const { wrapper, queryClient } = makeWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useRevokePermissionFromRole(), { wrapper })

    act(() => {
      result.current.mutate({ roleId: MOCK_ROLE.id, permissionId: 'perm-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: roleKeys.detail(MOCK_ROLE.id) })
  })

  it('calls onSuccess callback when provided', async () => {
    const onSuccess = vi.fn()
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useRevokePermissionFromRole({ onSuccess }), { wrapper })

    act(() => {
      result.current.mutate({ roleId: MOCK_ROLE.id, permissionId: 'perm-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('shows error toast on API failure', async () => {
    const { toast } = await import('@/lib/toast')
    server.use(
      http.delete('*/roles/:roleId/permissions/:permissionId', () =>
        HttpResponse.json(
          { errorCode: 'SERVER_ERROR', message: 'Revoke failed.', correlationId: 'id' },
          { status: 500 },
        ),
      ),
    )
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useRevokePermissionFromRole(), { wrapper })

    act(() => {
      result.current.mutate({ roleId: MOCK_ROLE.id, permissionId: 'perm-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Revoke failed.')
  })

  it('shows error toast on 403 forbidden', async () => {
    const { toast } = await import('@/lib/toast')
    server.use(
      http.delete('*/roles/:roleId/permissions/:permissionId', () =>
        HttpResponse.json(
          { errorCode: 'FORBIDDEN', message: 'Insufficient permissions.', correlationId: 'id' },
          { status: 403 },
        ),
      ),
    )
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useRevokePermissionFromRole(), { wrapper })

    act(() => {
      result.current.mutate({ roleId: MOCK_ROLE.id, permissionId: 'perm-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Insufficient permissions.')
  })
})
