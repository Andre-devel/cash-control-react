import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { MOCK_PROFILE } from '@/test/msw/handlers'
import { useUpdateProfile } from '../use-update-profile'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn() },
  LOG_EVENTS: {},
}))

let queryClient: QueryClient

function Wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
})

describe('useUpdateProfile', () => {
  it('calls PUT /users/me with the updated data', async () => {
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ name: 'Updated Name' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('shows a success toast on successful update', async () => {
    const { toast } = await import('@/lib/toast')
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ name: 'Updated Name' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(toast.success).toHaveBeenCalledWith('Profile updated successfully.')
  })

  it('invalidates the profile query cache on success', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ name: 'Updated Name' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['profile'] }))
  })

  it('returns updated profile data from the server', async () => {
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ name: 'New Name' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({ ...MOCK_PROFILE, name: 'New Name' })
  })

  it('shows an error toast on API failure', async () => {
    const { toast } = await import('@/lib/toast')
    server.use(
      http.put('*/users/me', () =>
        HttpResponse.json(
          {
            errorCode: 'VALIDATION_ERROR',
            message: 'Name is invalid.',
            correlationId: 'test-id',
          },
          { status: 422 },
        ),
      ),
    )

    const { result } = renderHook(() => useUpdateProfile(), { wrapper: Wrapper })

    act(() => {
      result.current.mutate({ name: 'Bad Name' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(toast.error).toHaveBeenCalledWith('Name is invalid.')
  })
})
