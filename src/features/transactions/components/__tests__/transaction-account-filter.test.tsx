import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import type { Account } from '@/features/accounts/types'
import { TransactionAccountFilter } from '../transaction-account-filter'

afterEach(() => {
  cleanup()
})

function account(id: string, name: string, sortOrder: number, archivedAt: string | null = null) {
  return {
    id,
    name,
    type: 'CHECKING',
    balance: '0.00',
    currencyCode: 'BRL',
    sortOrder,
    archivedAt,
    createdAt: '2026-01-01T00:00:00Z',
  } satisfies Account
}

const accounts = [
  account('pj', 'Inter CNPJ', 1),
  account('pf', 'Inter', 0),
  account('old', 'Antiga', 2, '2026-02-01T00:00:00Z'),
]

describe('TransactionAccountFilter', () => {
  it('lists the active accounts in the user order and marks the selected ones', () => {
    renderWithProviders(
      <TransactionAccountFilter accounts={accounts} selected={['pf']} onChange={vi.fn()} />,
    )

    const chips = screen.getAllByRole('button').map((b) => b.textContent)
    expect(chips).toEqual(['Todas', 'Inter', 'Inter CNPJ'])
    expect(screen.getByRole('button', { name: 'Inter' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('adds and removes an account with one tap, and "Todas" clears the selection', async () => {
    const onChange = vi.fn()
    renderWithProviders(
      <TransactionAccountFilter accounts={accounts} selected={['pf']} onChange={onChange} />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Inter CNPJ' }))
    expect(onChange).toHaveBeenLastCalledWith(['pf', 'pj'])
    await userEvent.click(screen.getByRole('button', { name: 'Inter' }))
    expect(onChange).toHaveBeenLastCalledWith([])
    await userEvent.click(screen.getByRole('button', { name: 'Todas' }))
    expect(onChange).toHaveBeenLastCalledWith([])
  })
})
