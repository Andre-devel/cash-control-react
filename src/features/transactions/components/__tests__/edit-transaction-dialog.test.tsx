import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { resetCardsStore } from '@/test/handlers/cards.handlers'
import {
  MOCK_TRANSACTION_1,
  MOCK_TRANSACTION_PENDING,
  resetTransactionsStore,
} from '@/test/handlers/transactions.handlers'
import { MOCK_PAYMENT_METHODS } from '@/test/handlers/payment-methods.handlers'
import type { Transaction } from '@/features/transactions/types'
import { EditTransactionDialog } from '../edit-transaction-dialog'

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

const MOCK_CREDIT_CARD_PM = MOCK_PAYMENT_METHODS.find((pm) => pm.slug === 'CREDIT_CARD')!

const MOCK_TRANSACTION_WITH_CREDIT_CARD: Transaction = {
  ...MOCK_TRANSACTION_1,
  paymentMethod: MOCK_CREDIT_CARD_PM,
  creditCard: { id: 'card-1', name: 'Nubank', brand: 'VISA' },
}

beforeEach(() => {
  resetTransactionsStore()
  resetCardsStore()
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

function renderDialog(transaction: Transaction | null = MOCK_TRANSACTION_1, open = true) {
  const onClose = vi.fn()
  renderWithProviders(
    <EditTransactionDialog transaction={transaction} open={open} onClose={onClose} />,
  )
  return { onClose }
}

async function waitForPaymentMethodsLoaded() {
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: /forma de pagamento/i })).not.toBeDisabled(),
  )
}

describe('EditTransactionDialog — payment method integration', () => {
  it('does not render when open is false', () => {
    renderDialog(MOCK_TRANSACTION_1, false)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('pre-populates paymentMethod from the transaction', async () => {
    renderDialog(MOCK_TRANSACTION_PENDING)
    await waitForPaymentMethodsLoaded()
    const paymentMethodSelect = screen.getByRole('combobox', {
      name: /forma de pagamento/i,
    }) as HTMLSelectElement
    expect(paymentMethodSelect.value).toBe(MOCK_TRANSACTION_PENDING.paymentMethod.slug)
  })

  it('hides the credit card picker when transaction has no credit card', async () => {
    renderDialog(MOCK_TRANSACTION_1)
    await waitForPaymentMethodsLoaded()
    expect(screen.queryByRole('combobox', { name: /cartão de crédito/i })).toBeNull()
  })

  it('shows the credit card picker when transaction has a credit card', async () => {
    renderDialog(MOCK_TRANSACTION_WITH_CREDIT_CARD)
    await waitForPaymentMethodsLoaded()
    expect(screen.getByRole('combobox', { name: /cartão de crédito/i })).toBeInTheDocument()
  })

  it('pre-populates creditCardId from the transaction', async () => {
    renderDialog(MOCK_TRANSACTION_WITH_CREDIT_CARD)
    await waitForPaymentMethodsLoaded()
    await waitFor(() => {
      const cardSelect = screen.getByRole('combobox', {
        name: /cartão de crédito/i,
      }) as HTMLSelectElement
      expect(cardSelect.value).toBe('card-1')
    })
  })

  it('shows credit card picker when user switches to CREDIT_CARD', async () => {
    const user = userEvent.setup()
    renderDialog(MOCK_TRANSACTION_1)
    await waitForPaymentMethodsLoaded()
    expect(screen.queryByRole('combobox', { name: /cartão de crédito/i })).toBeNull()
    await user.selectOptions(
      screen.getByRole('combobox', { name: /forma de pagamento/i }),
      'CREDIT_CARD',
    )
    expect(screen.getByRole('combobox', { name: /cartão de crédito/i })).toBeInTheDocument()
  })

  it('switching from CREDIT_CARD to PIX hides the credit card picker', async () => {
    const user = userEvent.setup()
    renderDialog(MOCK_TRANSACTION_WITH_CREDIT_CARD)
    await waitForPaymentMethodsLoaded()
    expect(screen.getByRole('combobox', { name: /cartão de crédito/i })).toBeInTheDocument()
    await user.selectOptions(screen.getByRole('combobox', { name: /forma de pagamento/i }), 'PIX')
    expect(screen.queryByRole('combobox', { name: /cartão de crédito/i })).toBeNull()
  })
})
