import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useUpdateRole } from '../use-update-role'
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

describe('useUpdateRole', () => {
  it('resolves and shows success toast', async () => {
    const { toast } = await import('@/lib/toast')
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useUpdateRole(), { wrapper })

    act(() => {
      result.current.mutate({ roleId: MOCK_ROLE.id, payload: { description: 'Updated' } })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Role updated successfully.')
  })

  it('invalidates roleKeys.detail(roleId) on success', async () => {
    const { wrapper, queryClient } = makeWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateRole(), { wrapper })

    act(() => {
      result.current.mutate({ roleId: MOCK_ROLE.id, payload: { description: 'Updated' } })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: roleKeys.detail(MOCK_ROLE.id) })
  })

  it('calls onSuccess callback when provided', async () => {
    const onSuccess = vi.fn()
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useUpdateRole({ onSuccess }), { wrapper })

    act(() => {
      result.current.mutate({ roleId: MOCK_ROLE.id, payload: { description: 'Updated' } })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('shows error toast on API failure', async () => {
    const { toast } = await import('@/lib/toast')
    server.use(
      http.put('*/roles/:roleId', () =>
        HttpResponse.json(
          { errorCode: 'SERVER_ERROR', message: 'Update failed.', correlationId: 'id' },
          { status: 500 },
        ),
      ),
    )
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useUpdateRole(), { wrapper })

    act(() => {
      result.current.mutate({ roleId: MOCK_ROLE.id, payload: { description: 'Updated' } })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Update failed.')
  })

  it('shows error toast on 403 forbidden', async () => {
    const { toast } = await import('@/lib/toast')
    server.use(
      http.put('*/roles/:roleId', () =>
        HttpResponse.json(
          { errorCode: 'FORBIDDEN', message: 'Insufficient permissions.', correlationId: 'id' },
          { status: 403 },
        ),
      ),
    )
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useUpdateRole(), { wrapper })

    act(() => {
      result.current.mutate({ roleId: MOCK_ROLE.id, payload: { description: 'Updated' } })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Insufficient permissions.')
  })
})
