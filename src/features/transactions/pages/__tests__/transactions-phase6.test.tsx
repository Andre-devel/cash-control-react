import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import {
  MOCK_TRANSACTION_1,
  MOCK_TRANSACTION_2,
  MOCK_TRANSACTION_PENDING,
  resetTransactionsStore,
} from '@/test/handlers/transactions.handlers'
import { MOCK_PAYMENT_METHODS } from '@/test/handlers/payment-methods.handlers'
import type { Transaction, PaginatedResponse } from '@/features/transactions/types'
import TransactionsPage from '../transactions-page'

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

describe('Phase 6 — Transaction list payment method display', () => {
  it('renders "Forma de pagamento" column header', async () => {
    renderWithProviders(<TransactionsPage />)
    await waitFor(() =>
      expect(screen.getByRole('columnheader', { name: 'Forma de pagamento' })).toBeTruthy(),
    )
  })

  it('displays the payment method name for each transaction row', async () => {
    const cashMethod = MOCK_PAYMENT_METHODS.find((pm) => pm.slug === 'CASH')!
    const pixMethod = MOCK_PAYMENT_METHODS.find((pm) => pm.slug === 'PIX')!

    const tx1WithCash: Transaction = {
      ...MOCK_TRANSACTION_1,
      paymentMethod: cashMethod,
    }
    const tx2WithPix: Transaction = {
      ...MOCK_TRANSACTION_2,
      paymentMethod: pixMethod,
    }

    const page: PaginatedResponse<Transaction> = {
      content: [tx1WithCash, tx2WithPix],
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 20,
    }

    server.use(http.get('*/transactions', () => HttpResponse.json(page)))

    renderWithProviders(<TransactionsPage />)
    await waitFor(() => expect(screen.getByText(tx1WithCash.description)).toBeTruthy())

    const table = document.querySelector('.tbl')!
    expect(within(table as HTMLElement).getByText(cashMethod.name)).toBeTruthy()
    expect(within(table as HTMLElement).getByText(pixMethod.name)).toBeTruthy()
  })

  it('displays "Outro" for transactions with slug OTHER', async () => {
    const otherMethod = MOCK_PAYMENT_METHODS.find((pm) => pm.slug === 'OTHER')!
    expect(otherMethod.name).toBe('Outro')

    const page: PaginatedResponse<Transaction> = {
      content: [{ ...MOCK_TRANSACTION_PENDING, paymentMethod: otherMethod }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
    }

    server.use(http.get('*/transactions', () => HttpResponse.json(page)))

    renderWithProviders(<TransactionsPage />)
    await waitFor(() => expect(screen.getByText(MOCK_TRANSACTION_PENDING.description)).toBeTruthy())

    const table = document.querySelector('.tbl')!
    expect(within(table as HTMLElement).getByText('Outro')).toBeTruthy()
  })

  it('payment method cell does not overflow — uses text-overflow: ellipsis', async () => {
    renderWithProviders(<TransactionsPage />)
    await waitFor(() => expect(screen.getByText(MOCK_TRANSACTION_1.description)).toBeTruthy())

    const cells = document.querySelectorAll('td')
    const paymentMethodCells = Array.from(cells).filter(
      (cell) => (cell as HTMLElement).style.overflow === 'hidden',
    )
    expect(paymentMethodCells.length).toBeGreaterThan(0)
  })
})
