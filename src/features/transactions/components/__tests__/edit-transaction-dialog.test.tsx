import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, screen, waitFor, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { resetCardsStore } from '@/test/handlers/cards.handlers'
import {
  MOCK_TRANSACTION_1,
  MOCK_TRANSACTION_2,
  MOCK_TRANSACTION_PENDING,
  resetTransactionsStore,
} from '@/test/handlers/transactions.handlers'
import { MOCK_PAYMENT_METHODS } from '@/test/handlers/payment-methods.handlers'
import type { Transaction } from '@/features/transactions/types'
import { toast } from '@/lib/toast'
import { EditTransactionDialog } from '../edit-transaction-dialog'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn(), action: vi.fn() },
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

describe('EditTransactionDialog — type', () => {
  it('lets an income switch to refund and sends the new type', async () => {
    let sent: Record<string, unknown> | undefined
    server.use(
      http.put('*/transactions/:id', async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...MOCK_TRANSACTION_2, ...sent })
      }),
    )
    const user = userEvent.setup()
    renderDialog(MOCK_TRANSACTION_2)
    await waitForPaymentMethodsLoaded()

    await user.click(screen.getByRole('radio', { name: 'Reembolso' }))
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

    await waitFor(() => expect(sent?.type).toBe('REFUND'))
  })

  it('does not offer a type change for expenses', async () => {
    renderDialog(MOCK_TRANSACTION_1)
    await waitForPaymentMethodsLoaded()
    expect(screen.queryByRole('radio', { name: 'Reembolso' })).toBeNull()
  })
})

describe('EditTransactionDialog — regra a partir da correção', () => {
  const FROM_BANK: Transaction = { ...MOCK_TRANSACTION_1, counterpartyName: 'Mercado Bom Ltda' }

  function mockUpdate() {
    server.use(
      http.put('*/transactions/:id', async ({ request }) => {
        const sent = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...MOCK_TRANSACTION_1, ...sent })
      }),
    )
  }

  async function saveWithCategory(user: ReturnType<typeof userEvent.setup>, name?: string) {
    await waitForPaymentMethodsLoaded()
    if (name) {
      await user.click(screen.getByRole('combobox', { name: 'Categoria' }))
      await user.click(await screen.findByRole('option', { name }))
    }
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))
    await waitFor(() => expect(toast.success).toHaveBeenCalled())
  }

  it('offers the rule after saving a bank transaction with another category', async () => {
    mockUpdate()
    const user = userEvent.setup()
    renderDialog(FROM_BANK)

    await saveWithCategory(user, 'Salary')

    expect(toast.action).toHaveBeenCalledTimes(1)
    const [message, action] = vi.mocked(toast.action).mock.calls[0]
    expect(message).toBe('Tudo com «SUPERMARKET» vai para Salary?')

    await act(async () => action.onClick())
    const dialog = within(await screen.findByRole('dialog', { name: /nova regra/i }))
    expect(dialog.getByPlaceholderText(/supermercado/i)).toHaveValue('SUPERMARKET')
    expect(dialog.getByRole('combobox', { name: 'Categoria' })).toHaveValue('cat-2')
    await waitFor(() =>
      expect(dialog.getByRole('combobox', { name: 'Conta' })).toHaveValue('account-1'),
    )
  })

  it('does not offer a rule when the category stayed the same', async () => {
    mockUpdate()
    const user = userEvent.setup()
    renderDialog(FROM_BANK)

    await saveWithCategory(user)

    expect(toast.action).not.toHaveBeenCalled()
  })

  it('does not offer a rule for a transaction that did not come from the bank', async () => {
    mockUpdate()
    const user = userEvent.setup()
    renderDialog(MOCK_TRANSACTION_1)

    await saveWithCategory(user, 'Salary')

    expect(toast.action).not.toHaveBeenCalled()
  })
})
