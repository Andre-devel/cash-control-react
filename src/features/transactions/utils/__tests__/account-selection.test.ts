import { describe, it, expect, beforeEach } from 'vitest'
import type { Account } from '@/features/accounts/types'
import {
  principalAccount,
  resolveAccountSelection,
  storeAccountSelection,
} from '../account-selection'

function account(id: string, type: Account['type'], sortOrder: number): Account {
  return {
    id,
    name: id,
    type,
    balance: '0.00',
    currencyCode: 'BRL',
    sortOrder,
    archivedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
  }
}

const accounts = [
  account('invest', 'INVESTMENT', 0),
  account('pj', 'CHECKING', 2),
  account('pf', 'CHECKING', 1),
]

beforeEach(() => {
  localStorage.clear()
})

describe('account selection', () => {
  it('picks the first checking account in the user order as the principal one', () => {
    expect(principalAccount(accounts)?.id).toBe('pf')
  })

  it('opens on the principal account the first time', () => {
    expect(resolveAccountSelection(new URLSearchParams(), accounts)).toEqual(['pf'])
  })

  it('waits for the accounts when the URL does not say which ones', () => {
    expect(resolveAccountSelection(new URLSearchParams(), undefined)).toBeNull()
  })

  it('prefers the URL, then the stored choice, dropping accounts that no longer exist', () => {
    storeAccountSelection(['pj', 'gone'])
    expect(resolveAccountSelection(new URLSearchParams(), accounts)).toEqual(['pj'])
    expect(
      resolveAccountSelection(new URLSearchParams('accountId=pf&accountId=invest'), accounts),
    ).toEqual(['pf', 'invest'])
    expect(resolveAccountSelection(new URLSearchParams('accounts=all'), accounts)).toEqual([])
  })

  it('remembers "all accounts" as a choice of its own', () => {
    storeAccountSelection([])
    expect(resolveAccountSelection(new URLSearchParams(), accounts)).toEqual([])
  })
})
