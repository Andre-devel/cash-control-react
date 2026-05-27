import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import {
  MOCK_TRANSACTION_1,
  MOCK_TRANSACTION_2,
  MOCK_TRANSACTION_PENDING,
  MOCK_TRANSACTION_CANCELLED,
  resetTransactionsStore,
} from '@/test/handlers/transactions.handlers'
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

describe('TransactionsPage', () => {
  it('renders the page heading', async () => {
    renderWithProviders(<TransactionsPage />)
    await waitFor(() => expect(screen.getByRole('heading', { name: /transactions/i })).toBeTruthy())
  })

  it('shows a loading skeleton while fetching', () => {
    renderWithProviders(<TransactionsPage />)
    expect(screen.getByLabelText('Loading transactions')).toBeTruthy()
  })

  it('renders active transactions after loading (cancelled hidden by default)', async () => {
    renderWithProviders(<TransactionsPage />)
    await waitFor(() => {
      expect(screen.getByText(MOCK_TRANSACTION_1.description)).toBeTruthy()
      expect(screen.getByText(MOCK_TRANSACTION_2.description)).toBeTruthy()
    })
    expect(screen.queryByText(MOCK_TRANSACTION_CANCELLED.description)).toBeNull()
  })

  it('show cancelled toggle reveals cancelled transactions', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)

    await waitFor(() => screen.getByText(MOCK_TRANSACTION_1.description))
    await user.click(screen.getByRole('button', { name: /show cancelled/i }))

    await waitFor(() =>
      expect(screen.getByText(MOCK_TRANSACTION_CANCELLED.description)).toBeTruthy(),
    )
  })

  it('shows empty state when no transactions exist', async () => {
    server.use(
      http.get('*/transactions', () =>
        HttpResponse.json({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 }),
      ),
    )
    renderWithProviders(<TransactionsPage />)
    await waitFor(() => expect(screen.getByText(/no transactions found/i)).toBeTruthy())
  })

  it('shows empty state with create CTA', async () => {
    server.use(
      http.get('*/transactions', () =>
        HttpResponse.json({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 }),
      ),
    )
    renderWithProviders(<TransactionsPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /create your first transaction/i })).toBeTruthy(),
    )
  })

  it('shows error state when API fails', async () => {
    server.use(
      http.get('*/transactions', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    renderWithProviders(<TransactionsPage />)
    await waitFor(() => expect(screen.getByText(/failed to load transactions/i)).toBeTruthy())
  })

  it('error state has retry button', async () => {
    server.use(
      http.get('*/transactions', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    renderWithProviders(<TransactionsPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy())
  })

  it('New Transaction button opens create dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)
    await waitFor(() => screen.getByRole('button', { name: /new transaction/i }))
    await user.click(screen.getByRole('button', { name: /new transaction/i }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(screen.getByRole('heading', { name: /create transaction/i })).toBeTruthy()
  })

  it('create transaction form shows required description validation error', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)

    await waitFor(() => screen.getByRole('button', { name: /new transaction/i }))
    await user.click(screen.getByRole('button', { name: /new transaction/i }))
    await waitFor(() => screen.getByRole('dialog'))

    const descInput = screen.getByRole('textbox', { name: /description/i })
    await user.clear(descInput)

    await user.click(screen.getByRole('button', { name: /create transaction/i }))

    await waitFor(() => expect(screen.getByText(/description is required/i)).toBeTruthy())
  })

  it('create transaction → appears in list', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)

    await waitFor(() => screen.getByRole('button', { name: /new transaction/i }))
    await user.click(screen.getByRole('button', { name: /new transaction/i }))
    await waitFor(() => screen.getByRole('dialog'))

    await user.clear(screen.getByRole('textbox', { name: /description/i }))
    await user.type(screen.getByRole('textbox', { name: /description/i }), 'Coffee shop')

    await user.clear(screen.getByRole('textbox', { name: /amount/i }))
    await user.type(screen.getByRole('textbox', { name: /amount/i }), '12.50')

    // Select an account (wait for the options to load)
    await waitFor(() => {
      const select = screen.getByRole('combobox', { name: /^account$/i })
      expect(select.querySelectorAll('option').length).toBeGreaterThan(1)
    })
    const accountSelect = screen.getByRole('combobox', { name: /^account$/i })
    await user.selectOptions(accountSelect, 'account-1')

    await user.click(screen.getByRole('button', { name: /create transaction/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(screen.getByText('Coffee shop')).toBeTruthy())
  })

  it('pay button triggers pay action and updates status', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)

    await waitFor(() => screen.getByText(MOCK_TRANSACTION_PENDING.description))

    const payButtons = screen.getAllByRole('button', { name: /^pay$/i })
    expect(payButtons.length).toBeGreaterThan(0)
    await user.click(payButtons[0])

    await waitFor(() => {
      const paidBadges = screen.getAllByText('Paid')
      expect(paidBadges.length).toBeGreaterThan(0)
    })
  })

  it('cancel button opens confirmation dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)

    await waitFor(() => screen.getByText(MOCK_TRANSACTION_1.description))

    const cancelButtons = screen.getAllByRole('button', { name: /^cancel$/i })
    await user.click(cancelButtons[0])

    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(screen.getByRole('heading', { name: /cancel transaction/i })).toBeTruthy()
  })

  it('delete button opens confirmation dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)

    await waitFor(() => screen.getByText(MOCK_TRANSACTION_1.description))

    const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i })
    await user.click(deleteButtons[0])

    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(screen.getByRole('heading', { name: /delete transaction/i })).toBeTruthy()
  })

  it('filter by type filters the list', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)

    await waitFor(() => screen.getByText(MOCK_TRANSACTION_1.description))

    const typeFilter = screen.getByRole('combobox', { name: /filter by type/i })
    await user.selectOptions(typeFilter, 'INCOME')

    await waitFor(() => {
      expect(screen.getByText(MOCK_TRANSACTION_2.description)).toBeTruthy()
    })
    expect(screen.queryByText(MOCK_TRANSACTION_1.description)).toBeNull()
  })

  describe('New Transaction button accessibility', () => {
    it('New Transaction button meets 44px min height', async () => {
      renderWithProviders(<TransactionsPage />)
      await waitFor(() => screen.getByRole('button', { name: /new transaction/i }))
      const btn = screen.getByRole('button', { name: /new transaction/i })
      expect(btn.className).toContain('min-h-[44px]')
    })
  })
})
