import { http, HttpResponse } from 'msw'
import type { Account } from '@/features/accounts/types'

export const MOCK_ACCOUNT_1: Account = {
  id: 'account-1',
  name: 'Nubank',
  type: 'CHECKING',
  balance: '1500.00',
  currency: 'BRL',
  color: '#820AD1',
  icon: 'wallet',
  archived: false,
  createdAt: '2026-01-01T00:00:00Z',
}

export const MOCK_ACCOUNT_2: Account = {
  id: 'account-2',
  name: 'Savings',
  type: 'SAVINGS',
  balance: '5000.00',
  currency: 'BRL',
  color: '#4CAF50',
  icon: 'piggy-bank',
  archived: false,
  createdAt: '2026-01-01T00:00:00Z',
}

export const MOCK_ARCHIVED_ACCOUNT: Account = {
  id: 'account-archived',
  name: 'Old Account',
  type: 'CHECKING',
  balance: '0.00',
  currency: 'BRL',
  color: '#9E9E9E',
  icon: 'archive',
  archived: true,
  createdAt: '2025-01-01T00:00:00Z',
}

let accountsStore: Account[] = [MOCK_ACCOUNT_1, MOCK_ACCOUNT_2]

export function resetAccountsStore() {
  accountsStore = [MOCK_ACCOUNT_1, MOCK_ACCOUNT_2]
}

export const accountsHandlers = [
  http.get('*/accounts', ({ request }) => {
    const url = new URL(request.url)
    const includeArchived = url.searchParams.get('includeArchived') === 'true'
    const result = includeArchived ? accountsStore : accountsStore.filter((a) => !a.archived)
    return HttpResponse.json(result)
  }),

  http.get('*/accounts/:id', ({ params }) => {
    const account = accountsStore.find((a) => a.id === params.id)
    if (!account) {
      return HttpResponse.json(
        {
          errorCode: 'ACCOUNT_NOT_FOUND',
          message: 'Account not found.',
          correlationId: 'test-id',
        },
        { status: 404 },
      )
    }
    return HttpResponse.json(account)
  }),

  http.post('*/accounts', async ({ request }) => {
    const body = (await request.json()) as Omit<Account, 'id' | 'archived' | 'createdAt'>
    const created: Account = {
      id: `account-${Date.now()}`,
      archived: false,
      createdAt: new Date().toISOString(),
      ...body,
    }
    accountsStore = [...accountsStore, created]
    return HttpResponse.json(created, { status: 201 })
  }),

  http.put('*/accounts/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<Account>
    accountsStore = accountsStore.map((a) => (a.id === params.id ? { ...a, ...body } : a))
    const updated = accountsStore.find((a) => a.id === params.id)
    return HttpResponse.json(updated)
  }),

  http.delete('*/accounts/:id', ({ params }) => {
    if (params.id === 'account-with-transactions') {
      return HttpResponse.json(
        {
          errorCode: 'ACCOUNT_HAS_TRANSACTIONS',
          message: 'Account has linked transactions and cannot be deleted.',
          correlationId: 'test-id',
        },
        { status: 409 },
      )
    }
    accountsStore = accountsStore.filter((a) => a.id !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/accounts/:id/archive', ({ params }) => {
    accountsStore = accountsStore.map((a) => (a.id === params.id ? { ...a, archived: true } : a))
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/accounts/:id/unarchive', ({ params }) => {
    accountsStore = accountsStore.map((a) => (a.id === params.id ? { ...a, archived: false } : a))
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/accounts/:id/adjust', async ({ params, request }) => {
    const body = (await request.json()) as { targetBalance: string; note?: string }
    accountsStore = accountsStore.map((a) =>
      a.id === params.id ? { ...a, balance: body.targetBalance } : a,
    )
    const updated = accountsStore.find((a) => a.id === params.id)
    return HttpResponse.json(updated)
  }),

  http.post('*/accounts/transfers', async ({ request }) => {
    await request.json()
    return new HttpResponse(null, { status: 201 })
  }),

  http.delete('*/accounts/transfers/:groupId', () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
