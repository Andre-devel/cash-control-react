import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { resetTransactionsStore } from '@/test/handlers/transactions.handlers'
import { MOCK_PAYMENT_METHOD_OTHER } from '@/test/handlers/payment-methods.handlers'
import TransactionsPage from '../transactions-page'
import type { Transaction } from '@/features/transactions/types'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn() },
  LOG_EVENTS: {},
}))

vi.mock('@/styles/theme/dark-mode', () => ({
  applyTheme: vi.fn(),
  resolveTheme: vi.fn((t: string) => (t === 'dark' ? 'dark' : 'light')),
}))

beforeEach(() => {
  resetTransactionsStore()
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

/** Linha que o backend devolve para "R$ 1.000,00 em 5x" com groupInstallments=true. */
const GROUPED_SERIES: Transaction = {
  id: 'tx-installment-1',
  description: 'Notebook',
  amount: '1000.00',
  type: 'EXPENSE',
  status: 'PENDING',
  accountId: 'account-1',
  categoryId: null,
  competenceDate: '2026-06-10',
  paymentDate: null,
  createdAt: '2026-06-10T00:00:00Z',
  paymentMethod: MOCK_PAYMENT_METHOD_OTHER,
  creditCard: null,
  installmentSeriesId: 'series-1',
  installmentNumber: 1,
  totalInstallments: 5,
  installmentTotalAmount: '1000.00',
  paidInstallments: 1,
  installmentGroup: true,
}

function serveGroupedSeries() {
  server.use(
    http.get('*/transactions', () =>
      HttpResponse.json({
        content: [GROUPED_SERIES],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 20,
      }),
    ),
  )
}

describe('grid de transações — parcelamento colapsado', () => {
  it('pede a listagem agrupada ao backend', async () => {
    const seen: string[] = []
    server.use(
      http.get('*/transactions', ({ request }) => {
        seen.push(new URL(request.url).searchParams.get('groupInstallments') ?? '')
        return HttpResponse.json({
          content: [GROUPED_SERIES],
          totalElements: 1,
          totalPages: 1,
          number: 0,
          size: 20,
        })
      }),
    )

    renderWithProviders(<TransactionsPage />)

    await waitFor(() => expect(seen.length).toBeGreaterThan(0))
    expect(seen[0]).toBe('true')
  })

  it('mostra a compra uma única vez, com o valor cheio e o número de parcelas', async () => {
    serveGroupedSeries()
    renderWithProviders(<TransactionsPage />)

    await waitFor(() => expect(screen.getAllByText('Notebook')).toHaveLength(1))
    expect(screen.getByText('5x')).toBeTruthy()

    // R$ 1.000,00 — a compra inteira, não a parcela de R$ 200,00.
    const row = screen.getByText('Notebook').closest('tr')!
    expect(row.textContent).toContain('1.000,00')
    expect(row.textContent).not.toContain('200,00')
  })

  it('troca as ações por parcela pelo atalho para a série', async () => {
    serveGroupedSeries()
    renderWithProviders(<TransactionsPage />)

    await waitFor(() => expect(screen.getByText('Notebook')).toBeTruthy())
    expect(screen.getByRole('button', { name: 'Ver parcelas' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Excluir' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Pagar' })).toBeNull()
  })
})
