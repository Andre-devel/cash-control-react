import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, cleanup } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import type { Transaction } from '@/features/transactions/types'
import { RecentTransfersCard } from '../recent-transfers-card'

vi.mock('@/styles/theme/dark-mode', () => ({
  applyTheme: vi.fn(),
  resolveTheme: vi.fn((t: string) => (t === 'dark' ? 'dark' : 'light')),
}))

afterEach(() => {
  cleanup()
})

function leg(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'leg',
    description: 'Transferência',
    amount: '0',
    type: 'TRANSFER',
    status: 'PAID',
    accountId: 'acc',
    categoryId: null,
    competenceDate: '2026-11-02',
    paymentDate: '2026-11-02',
    createdAt: '2026-11-02T12:00:00Z',
    paymentMethod: { id: 'pm', name: 'Transferência', slug: 'BANK_TRANSFER' },
    creditCard: null,
    ...overrides,
  } as Transaction
}

describe('RecentTransfersCard', () => {
  it('shows each transfer once, joining both legs into "origem → destino"', async () => {
    let requestedSize: string | null = null
    server.use(
      http.get('*/transactions', ({ request }) => {
        requestedSize = new URL(request.url).searchParams.get('size')
        return HttpResponse.json({
          content: [
            leg({ id: 'in', accountId: 'cdb', accountName: 'CDB teste', amount: '500.00' }),
            leg({ id: 'out', accountId: 'inter', accountName: 'Inter', amount: '-500.00' }),
          ],
          totalElements: 2,
          totalPages: 1,
          number: 0,
          size: 8,
        })
      }),
    )

    renderWithProviders(<RecentTransfersCard />)

    expect(await screen.findByText('Inter → CDB teste')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('R$ 500,00')).toBeInTheDocument()
    expect(requestedSize).toBe('8')
  })
})
