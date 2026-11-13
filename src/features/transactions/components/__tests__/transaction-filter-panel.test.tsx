import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, cleanup } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import { TransactionFilterFields } from '../transaction-filter-panel'

vi.mock('@/styles/theme/dark-mode', () => ({
  applyTheme: vi.fn(),
  resolveTheme: vi.fn((t: string) => (t === 'dark' ? 'dark' : 'light')),
}))

afterEach(() => {
  cleanup()
})

describe('TransactionFilterFields', () => {
  it('renders every filter with the same select (and chevron); accounts live above the list', () => {
    renderWithProviders(
      <TransactionFilterFields
        filters={{}}
        categories={[]}
        includeCancelled={false}
        onFiltersChange={vi.fn()}
        onToggleIncludeCancelled={vi.fn()}
      />,
    )

    expect(screen.queryByRole('combobox', { name: 'Filtrar por conta' })).not.toBeInTheDocument()
    for (const name of ['Filtrar por tipo', 'Filtrar por status', 'Filtrar por categoria']) {
      expect(screen.getByRole('combobox', { name })).toHaveClass('select')
    }
  })
})
