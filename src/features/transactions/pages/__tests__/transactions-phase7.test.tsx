import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import {
  MOCK_TRANSACTION_1,
  MOCK_TRANSACTION_CASH,
  MOCK_TRANSACTION_CREDIT_CARD,
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

async function waitForTransactionsLoaded() {
  await waitFor(() => expect(screen.getByText(MOCK_TRANSACTION_1.description)).toBeTruthy())
}

async function waitForPaymentMethodFilterLoaded() {
  await waitFor(() =>
    expect(
      screen.getByRole('combobox', { name: /filtrar por forma de pagamento/i }),
    ).not.toBeDisabled(),
  )
}

describe('Phase 7 — Payment method filter', () => {
  it('renders a payment method filter select in the filter panel', async () => {
    renderWithProviders(<TransactionsPage />)
    await waitForTransactionsLoaded()
    expect(screen.getByRole('combobox', { name: /filtrar por forma de pagamento/i })).toBeTruthy()
  })

  it('payment method filter has "Todas as formas" as the default empty option', async () => {
    renderWithProviders(<TransactionsPage />)
    await waitForPaymentMethodFilterLoaded()

    const option = screen.getByRole('option', { name: /todas as formas/i })
    expect(option).toBeTruthy()
    expect((option as HTMLOptionElement).value).toBe('')
  })

  it('payment method filter lists all seven payment methods', async () => {
    renderWithProviders(<TransactionsPage />)
    await waitForPaymentMethodFilterLoaded()

    expect(screen.getByRole('option', { name: /dinheiro/i })).toBeTruthy()
    expect(screen.getByRole('option', { name: /pix/i })).toBeTruthy()
    expect(screen.getByRole('option', { name: /cartão de débito/i })).toBeTruthy()
    expect(screen.getByRole('option', { name: /cartão de crédito/i })).toBeTruthy()
    expect(screen.getByRole('option', { name: /transferência bancária/i })).toBeTruthy()
    expect(screen.getByRole('option', { name: /boleto/i })).toBeTruthy()
    expect(screen.getByRole('option', { name: /outro/i })).toBeTruthy()
  })

  it('selecting a payment method filters the transaction list', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)
    await waitForTransactionsLoaded()
    await waitForPaymentMethodFilterLoaded()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /filtrar por forma de pagamento/i }),
      'CASH',
    )

    await waitFor(() => expect(screen.getByText(MOCK_TRANSACTION_CASH.description)).toBeTruthy())
    expect(screen.queryByText(MOCK_TRANSACTION_1.description)).toBeNull()
  })

  it('filtering by CREDIT_CARD shows only credit card transactions', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)
    await waitForTransactionsLoaded()
    await waitForPaymentMethodFilterLoaded()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /filtrar por forma de pagamento/i }),
      'CREDIT_CARD',
    )

    await waitFor(() =>
      expect(screen.getByText(MOCK_TRANSACTION_CREDIT_CARD.description)).toBeTruthy(),
    )
    expect(screen.queryByText(MOCK_TRANSACTION_1.description)).toBeNull()
    expect(screen.queryByText(MOCK_TRANSACTION_CASH.description)).toBeNull()
  })

  it('filter select gets "on" class when a payment method is selected', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)
    await waitForTransactionsLoaded()
    await waitForPaymentMethodFilterLoaded()

    const filterSelect = screen.getByRole('combobox', { name: /filtrar por forma de pagamento/i })
    expect(filterSelect.className).not.toContain('on')

    await user.selectOptions(filterSelect, 'CASH')

    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: /filtrar por forma de pagamento/i }).className,
      ).toContain('on'),
    )
  })

  it('selecting "Todas as formas" clears the payment method filter', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)
    await waitForTransactionsLoaded()
    await waitForPaymentMethodFilterLoaded()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /filtrar por forma de pagamento/i }),
      'CASH',
    )

    await waitFor(() => expect(screen.getByText(MOCK_TRANSACTION_CASH.description)).toBeTruthy())
    expect(screen.queryByText(MOCK_TRANSACTION_1.description)).toBeNull()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /filtrar por forma de pagamento/i }),
      '',
    )

    await waitFor(() => expect(screen.getByText(MOCK_TRANSACTION_1.description)).toBeTruthy())
    expect(screen.getByText(MOCK_TRANSACTION_CASH.description)).toBeTruthy()
  })

  it('"Limpar filtros" button clears the payment method filter', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)
    await waitForTransactionsLoaded()
    await waitForPaymentMethodFilterLoaded()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /filtrar por forma de pagamento/i }),
      'CASH',
    )

    await waitFor(() => expect(screen.getByText(MOCK_TRANSACTION_CASH.description)).toBeTruthy())
    expect(screen.queryByText(MOCK_TRANSACTION_1.description)).toBeNull()

    await user.click(screen.getByRole('button', { name: /limpar filtros/i }))

    await waitFor(() => expect(screen.getByText(MOCK_TRANSACTION_1.description)).toBeTruthy())

    const filterSelect = screen.getByRole('combobox', {
      name: /filtrar por forma de pagamento/i,
    }) as HTMLSelectElement
    expect(filterSelect.value).toBe('')
    expect(filterSelect.className).not.toContain('on')
  })
})
