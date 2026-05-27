import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useCreateRole } from '../use-create-role'
import { roleKeys } from '@/features/roles/api'

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

describe('useCreateRole', () => {
  it('calls createRole and returns the created role', async () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useCreateRole(), { wrapper })

    act(() => {
      result.current.mutate({ name: 'MODERATOR', description: 'Test role' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.name).toBe('MODERATOR')
  })

  it('shows success toast on success', async () => {
    const { toast } = await import('@/lib/toast')
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useCreateRole(), { wrapper })

    act(() => {
      result.current.mutate({ name: 'MODERATOR' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Role created successfully.')
  })

  it('invalidates roleKeys.lists() on success', async () => {
    const { wrapper, queryClient } = makeWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useCreateRole(), { wrapper })

    act(() => {
      result.current.mutate({ name: 'MODERATOR' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: roleKeys.lists() })
  })

  it('calls onSuccess callback when provided', async () => {
    const onSuccess = vi.fn()
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useCreateRole({ onSuccess }), { wrapper })

    act(() => {
      result.current.mutate({ name: 'MODERATOR' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('shows error toast on 409 conflict', async () => {
    const { toast } = await import('@/lib/toast')
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useCreateRole(), { wrapper })

    act(() => {
      result.current.mutate({ name: 'DUPLICATE' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })

  it('shows error toast on API failure', async () => {
    const { toast } = await import('@/lib/toast')
    server.use(
      http.post('*/roles', () =>
        HttpResponse.json(
          { errorCode: 'SERVER_ERROR', message: 'Server error.', correlationId: 'id' },
          { status: 500 },
        ),
      ),
    )
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useCreateRole(), { wrapper })

    act(() => {
      result.current.mutate({ name: 'MODERATOR' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Server error.')
  })

  it('exposes mutate, isPending, and isError', () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useCreateRole(), { wrapper })
    expect(result.current.mutate).toBeDefined()
    expect(result.current.isPending).toBe(false)
    expect(result.current.isError).toBe(false)
  })
})
