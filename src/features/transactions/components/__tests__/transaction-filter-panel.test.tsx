import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, cleanup } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import type { Account } from '@/features/accounts/types'
import { TransactionFilterFields } from '../transaction-filter-panel'

vi.mock('@/styles/theme/dark-mode', () => ({
  applyTheme: vi.fn(),
  resolveTheme: vi.fn((t: string) => (t === 'dark' ? 'dark' : 'light')),
}))

afterEach(() => {
  cleanup()
})

const accounts: Account[] = [
  {
    id: 'acc-1',
    name: 'Inter',
    type: 'CHECKING',
    balance: '100.00',
    currencyCode: 'BRL',
    sortOrder: 0,
    archivedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
  },
]

describe('TransactionFilterFields', () => {
  it('renders the account filter with the same select (and chevron) as the other filters', () => {
    renderWithProviders(
      <TransactionFilterFields
        filters={{}}
        accounts={accounts}
        categories={[]}
        includeCancelled={false}
        onFiltersChange={vi.fn()}
        onToggleIncludeCancelled={vi.fn()}
      />,
    )

    const account = screen.getByRole('combobox', { name: 'Filtrar por conta' })
    expect(account).toHaveClass('select')
    expect(screen.getByRole('option', { name: 'Inter' })).toBeInTheDocument()
    for (const name of ['Filtrar por tipo', 'Filtrar por status', 'Filtrar por categoria']) {
      expect(screen.getByRole('combobox', { name })).toHaveClass('select')
    }
  })
})
