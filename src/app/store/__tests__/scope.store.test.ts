import { createElement, type ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  SCOPE_STORAGE_KEY,
  readScope,
  scopeParams,
  useScope,
  useScopeStore,
} from '@/app/store/scope.store'
import { useOverview } from '@/features/dashboard/hooks/use-overview'
import { useBalanceProjection } from '@/features/dashboard/hooks/use-balance-projection'
import {
  useTransactions,
  useTransactionTotals,
} from '@/features/transactions/hooks/use-transactions'
import { useBudgetProgress } from '@/features/budgets/hooks/use-budgets'
import { useCards } from '@/features/cards/hooks/use-cards'
import { listAccounts } from '@/features/accounts/api/accounts.api'

const { get } = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('@/services/http', () => ({ axiosInstance: { get } }))

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children),
  }
}

/** Parâmetros da última chamada `get(url, config)` para a URL. */
function lastParams(url: string) {
  const calls = get.mock.calls.filter(([u]) => u === url)
  const config = calls[calls.length - 1]?.[1] as { params?: Record<string, unknown> } | undefined
  return config?.params
}

beforeEach(() => {
  localStorage.clear()
  get.mockReset()
  get.mockResolvedValue({ data: {} })
  useScopeStore.setState({ scope: 'ALL' })
})

afterEach(() => {
  cleanup()
})

describe('scope store', () => {
  it('defaults to "Tudo" when nothing is stored', () => {
    expect(readScope()).toBe('ALL')
  })

  it('reads a stored scope back', () => {
    localStorage.setItem(SCOPE_STORAGE_KEY, 'BUSINESS')
    expect(readScope()).toBe('BUSINESS')
  })

  it('ignores an unknown stored value', () => {
    localStorage.setItem(SCOPE_STORAGE_KEY, 'PJ')
    expect(readScope()).toBe('ALL')
  })

  it('falls back to "Tudo" when storage is blocked', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readScope()).toBe('ALL')
    spy.mockRestore()
  })

  it('persists the chosen scope', () => {
    act(() => useScopeStore.getState().setScope('PERSONAL'))
    expect(useScopeStore.getState().scope).toBe('PERSONAL')
    expect(localStorage.getItem(SCOPE_STORAGE_KEY)).toBe('PERSONAL')
  })

  it('keeps the scope for the session when storage is blocked', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    act(() => useScopeStore.getState().setScope('BUSINESS'))
    expect(useScopeStore.getState().scope).toBe('BUSINESS')
    spy.mockRestore()
  })

  it('exposes the current scope through useScope', () => {
    const { result } = renderHook(() => useScope())
    expect(result.current).toBe('ALL')
    act(() => useScopeStore.getState().setScope('BUSINESS'))
    expect(result.current).toBe('BUSINESS')
  })
})

describe('scopeParams', () => {
  it('omits the parameter for "Tudo" (the API default)', () => {
    expect(scopeParams('ALL')).toEqual({})
    expect(scopeParams()).toEqual({})
  })

  it('sends PERSONAL and BUSINESS', () => {
    expect(scopeParams('PERSONAL')).toEqual({ scope: 'PERSONAL' })
    expect(scopeParams('BUSINESS')).toEqual({ scope: 'BUSINESS' })
  })
})

describe('switching the filter changes the fetch parameter', () => {
  it('refetches the dashboard overview with the new scope', async () => {
    const { wrapper } = makeWrapper()
    renderHook(() => useOverview(), { wrapper })
    await waitFor(() => expect(get).toHaveBeenCalledWith('/dashboard/overview', { params: {} }))

    act(() => useScopeStore.getState().setScope('BUSINESS'))
    await waitFor(() => expect(lastParams('/dashboard/overview')).toEqual({ scope: 'BUSINESS' }))
  })

  it('keeps the other parameters of the projection', async () => {
    useScopeStore.setState({ scope: 'PERSONAL' })
    const { wrapper } = makeWrapper()
    renderHook(() => useBalanceProjection(30), { wrapper })
    await waitFor(() =>
      expect(lastParams('/dashboard/projection')).toEqual({ days: 30, scope: 'PERSONAL' }),
    )
  })

  it('refetches the transaction list and totals with the new scope', async () => {
    const { wrapper } = makeWrapper()
    renderHook(
      () => {
        useTransactions({ page: 0, type: 'EXPENSE' })
        useTransactionTotals({ type: 'EXPENSE' })
      },
      { wrapper },
    )
    await waitFor(() => expect(lastParams('/transactions')).toEqual({ page: 0, type: 'EXPENSE' }))

    act(() => useScopeStore.getState().setScope('PERSONAL'))
    await waitFor(() =>
      expect(lastParams('/transactions')).toEqual({ page: 0, type: 'EXPENSE', scope: 'PERSONAL' }),
    )
    expect(lastParams('/transactions/summary')).toEqual({ type: 'EXPENSE', scope: 'PERSONAL' })
  })

  it('puts the scope in the query key', async () => {
    const { wrapper, queryClient } = makeWrapper()
    useScopeStore.setState({ scope: 'BUSINESS' })
    renderHook(() => useBudgetProgress('2026-11'), { wrapper })
    await waitFor(() =>
      expect(lastParams('/budgets')).toEqual({ month: '2026-11', scope: 'BUSINESS' }),
    )
    const keys = queryClient
      .getQueryCache()
      .getAll()
      .map((q) => q.queryKey)
    expect(keys).toContainEqual(['dashboard', 'budgets', '2026-11', 'BUSINESS'])
  })

  it('lists cards and accounts by an explicit scope, all of them by default', async () => {
    const { wrapper } = makeWrapper()
    get.mockResolvedValue({ data: [] })
    renderHook(() => useCards(), { wrapper })
    await waitFor(() => expect(get).toHaveBeenCalledWith('/cards', { params: {} }))
    renderHook(() => useCards('BUSINESS'), { wrapper })
    await waitFor(() => expect(lastParams('/cards')).toEqual({ scope: 'BUSINESS' }))

    await listAccounts({ includeArchived: true, scope: 'PERSONAL' })
    expect(lastParams('/accounts')).toEqual({ includeArchived: true, scope: 'PERSONAL' })
    await listAccounts({ scope: 'ALL' })
    expect(lastParams('/accounts')).toEqual({})
  })
})
