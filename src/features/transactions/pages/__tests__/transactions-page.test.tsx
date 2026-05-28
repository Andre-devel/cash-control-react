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
    await waitFor(() => expect(screen.getByRole('heading', { name: /transações/i })).toBeTruthy())
  })

  it('shows a loading skeleton while fetching', () => {
    renderWithProviders(<TransactionsPage />)
    expect(screen.getByLabelText('Carregando transações')).toBeTruthy()
  })

  it('renders active transactions after loading (cancelled hidden by default)', async () => {
    renderWithProviders(<TransactionsPage />)
    await waitFor(() => {
      expect(screen.getByText(MOCK_TRANSACTION_1.description)).toBeTruthy()
      expect(screen.getByText(MOCK_TRANSACTION_2.description)).toBeTruthy()
    })
    expect(screen.queryByText(MOCK_TRANSACTION_CANCELLED.description)).toBeNull()
  })

  it('incluir cancelados checkbox reveals cancelled transactions', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)

    await waitFor(() => screen.getByText(MOCK_TRANSACTION_1.description))
    await user.click(screen.getByRole('checkbox', { name: /incluir cancelados/i }))

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
    await waitFor(() => expect(screen.getByText(/nenhuma transação encontrada/i)).toBeTruthy())
  })

  it('shows empty state with create CTA', async () => {
    server.use(
      http.get('*/transactions', () =>
        HttpResponse.json({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 }),
      ),
    )
    renderWithProviders(<TransactionsPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /criar sua primeira transação/i })).toBeTruthy(),
    )
  })

  it('shows error state when API fails', async () => {
    server.use(
      http.get('*/transactions', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    renderWithProviders(<TransactionsPage />)
    await waitFor(() => expect(screen.getByText(/erro ao carregar transações/i)).toBeTruthy())
  })

  it('error state has retry button', async () => {
    server.use(
      http.get('*/transactions', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    renderWithProviders(<TransactionsPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeTruthy(),
    )
  })

  it('Nova transação button opens create dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)
    await waitFor(() => screen.getByRole('button', { name: /nova transação/i }))
    await user.click(screen.getByRole('button', { name: /nova transação/i }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(screen.getByRole('heading', { name: /nova transação/i })).toBeTruthy()
  })

  it('create transaction form shows required description validation error', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)

    await waitFor(() => screen.getByRole('button', { name: /nova transação/i }))
    await user.click(screen.getByRole('button', { name: /nova transação/i }))
    await waitFor(() => screen.getByRole('dialog'))

    const descInput = screen.getByRole('textbox', { name: /descrição/i })
    await user.clear(descInput)

    await user.click(screen.getByRole('button', { name: /criar transação/i }))

    await waitFor(() => expect(screen.getByText(/descrição é obrigatória/i)).toBeTruthy())
  })

  it('create transaction → appears in list', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)

    await waitFor(() => screen.getByRole('button', { name: /nova transação/i }))
    await user.click(screen.getByRole('button', { name: /nova transação/i }))
    await waitFor(() => screen.getByRole('dialog'))

    await user.clear(screen.getByRole('textbox', { name: /descrição/i }))
    await user.type(screen.getByRole('textbox', { name: /descrição/i }), 'Coffee shop')

    await user.clear(screen.getByRole('textbox', { name: /valor/i }))
    await user.type(screen.getByRole('textbox', { name: /valor/i }), '12.50')

    // Select an account (wait for the options to load)
    await waitFor(() => {
      const select = screen.getByRole('combobox', { name: /^conta$/i })
      expect(select.querySelectorAll('option').length).toBeGreaterThan(1)
    })
    const accountSelect = screen.getByRole('combobox', { name: /^conta$/i })
    await user.selectOptions(accountSelect, 'account-1')

    await user.click(screen.getByRole('button', { name: /criar transação/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(screen.getByText('Coffee shop')).toBeTruthy())
  })

  it('pay button triggers pay action and updates status', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)

    await waitFor(() => screen.getByText(MOCK_TRANSACTION_PENDING.description))

    const payButtons = screen.getAllByRole('button', { name: /^pagar$/i })
    expect(payButtons.length).toBeGreaterThan(0)
    await user.click(payButtons[0])

    await waitFor(() => {
      const paidBadges = screen.getAllByText('Pago')
      expect(paidBadges.length).toBeGreaterThan(0)
    })
  })

  it('cancel button opens confirmation dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)

    await waitFor(() => screen.getByText(MOCK_TRANSACTION_1.description))

    const cancelButtons = screen.getAllByRole('button', { name: /^cancelar$/i })
    await user.click(cancelButtons[0])

    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(screen.getByRole('heading', { name: /cancelar transação/i })).toBeTruthy()
  })

  it('delete button opens confirmation dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)

    await waitFor(() => screen.getByText(MOCK_TRANSACTION_1.description))

    const deleteButtons = screen.getAllByRole('button', { name: /^excluir$/i })
    await user.click(deleteButtons[0])

    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(screen.getByRole('heading', { name: /excluir transação/i })).toBeTruthy()
  })

  it('filter by type filters the list', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)

    await waitFor(() => screen.getByText(MOCK_TRANSACTION_1.description))

    const typeFilter = screen.getByRole('combobox', { name: /filtrar por tipo/i })
    await user.selectOptions(typeFilter, 'INCOME')

    await waitFor(() => {
      expect(screen.getByText(MOCK_TRANSACTION_2.description)).toBeTruthy()
    })
    expect(screen.queryByText(MOCK_TRANSACTION_1.description)).toBeNull()
  })

  it('renders summary strip with income, expense, and net KPIs', async () => {
    renderWithProviders(<TransactionsPage />)
    await waitFor(() => {
      expect(screen.getByText('Receitas (período)')).toBeTruthy()
      expect(screen.getByText('Despesas (período)')).toBeTruthy()
      expect(screen.getByText('Resultado líquido')).toBeTruthy()
    })
  })

  it('renders table column headers', async () => {
    renderWithProviders(<TransactionsPage />)
    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: 'Descrição' })).toBeTruthy()
      expect(screen.getByRole('columnheader', { name: 'Categoria' })).toBeTruthy()
      expect(screen.getByRole('columnheader', { name: 'Conta' })).toBeTruthy()
      expect(screen.getByRole('columnheader', { name: 'Status' })).toBeTruthy()
    })
  })

  it('renders TypeBadge and StatusBadge for each transaction', async () => {
    renderWithProviders(<TransactionsPage />)
    await waitFor(() => {
      expect(screen.getByText(MOCK_TRANSACTION_1.description)).toBeTruthy()
    })
    expect(screen.getAllByText('Despesa').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pago').length).toBeGreaterThan(0)
  })
})
