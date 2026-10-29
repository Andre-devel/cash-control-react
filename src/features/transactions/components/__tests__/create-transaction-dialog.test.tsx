import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { resetTransactionsStore } from '@/test/handlers/transactions.handlers'
import { resetCardsStore } from '@/test/handlers/cards.handlers'
import { CreateTransactionDialog } from '../create-transaction-dialog'

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
  resetCardsStore()
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

function renderDialog(open = true) {
  const onClose = vi.fn()
  renderWithProviders(<CreateTransactionDialog open={open} onClose={onClose} />)
  return { onClose }
}

async function waitForPaymentMethodsLoaded() {
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: /forma de pagamento/i })).not.toBeDisabled(),
  )
}

describe('CreateTransactionDialog — payment method integration', () => {
  it('does not render when open is false', () => {
    renderDialog(false)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('hides the credit card picker by default (paymentMethod defaults to OTHER)', async () => {
    renderDialog()
    await waitForPaymentMethodsLoaded()
    expect(screen.queryByRole('combobox', { name: /cartão de crédito/i })).toBeNull()
  })

  it('shows the credit card picker when CREDIT_CARD is selected', async () => {
    const user = userEvent.setup()
    renderDialog()
    await waitForPaymentMethodsLoaded()
    await user.selectOptions(
      screen.getByRole('combobox', { name: /forma de pagamento/i }),
      'CREDIT_CARD',
    )
    expect(screen.getByRole('combobox', { name: /cartão de crédito/i })).toBeInTheDocument()
  })

  it('blocks submit when CREDIT_CARD is selected but no card is chosen', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByRole('textbox', { name: /descrição/i }), 'Test transaction')

    await waitFor(() => screen.getByRole('option', { name: 'Nubank' }))
    await user.selectOptions(screen.getByRole('combobox', { name: /conta/i }), 'account-1')

    await waitForPaymentMethodsLoaded()
    await user.selectOptions(
      screen.getByRole('combobox', { name: /forma de pagamento/i }),
      'CREDIT_CARD',
    )

    await user.click(screen.getByRole('button', { name: /criar transação/i }))

    await waitFor(() =>
      expect(screen.getByText(/selecione um cartão de crédito/i)).toBeInTheDocument(),
    )
  })

  it('switching from CREDIT_CARD to PIX hides the picker', async () => {
    const user = userEvent.setup()
    renderDialog()
    await waitForPaymentMethodsLoaded()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /forma de pagamento/i }),
      'CREDIT_CARD',
    )
    expect(screen.getByRole('combobox', { name: /cartão de crédito/i })).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox', { name: /forma de pagamento/i }), 'PIX')
    expect(screen.queryByRole('combobox', { name: /cartão de crédito/i })).toBeNull()
  })

  it('switching from CREDIT_CARD to PIX clears the card selection', async () => {
    const user = userEvent.setup()
    renderDialog()
    await waitForPaymentMethodsLoaded()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /forma de pagamento/i }),
      'CREDIT_CARD',
    )

    await waitFor(() => {
      const cardSelect = screen.getByRole('combobox', {
        name: /cartão de crédito/i,
      }) as HTMLSelectElement
      expect(cardSelect.options.length).toBeGreaterThan(1)
    })

    await user.selectOptions(screen.getByRole('combobox', { name: /cartão de crédito/i }), 'card-1')

    await user.selectOptions(screen.getByRole('combobox', { name: /forma de pagamento/i }), 'PIX')

    await user.selectOptions(
      screen.getByRole('combobox', { name: /forma de pagamento/i }),
      'CREDIT_CARD',
    )

    const cardSelectAfter = screen.getByRole('combobox', {
      name: /cartão de crédito/i,
    }) as HTMLSelectElement
    expect(cardSelectAfter.value).toBe('')
  })
})

describe('CreateTransactionDialog — padrões e validação', () => {
  it('começa como Pago, com valor vazio e campo de data do pagamento', async () => {
    renderDialog()
    await waitForPaymentMethodsLoaded()
    // Status virou controle segmentado (rádios).
    expect((screen.getByRole('radio', { name: /pago/i }) as HTMLInputElement).checked).toBe(true)
    expect((screen.getByRole('textbox', { name: /valor/i }) as HTMLInputElement).value).toBe('')
    expect(screen.getByLabelText(/data do pagamento/i)).toBeTruthy()
    expect(screen.queryByRole('option', { name: /cancelado/i })).toBeNull()
  })

  it('data futura sugere Pendente e esconde a data do pagamento', async () => {
    const user = userEvent.setup()
    renderDialog()
    await waitForPaymentMethodsLoaded()
    const date = screen.getByLabelText(/data de competência/i)
    await user.clear(date)
    await user.type(date, '2099-01-10')
    await waitFor(() =>
      expect((screen.getByRole('radio', { name: /pendente/i }) as HTMLInputElement).checked).toBe(
        true,
      ),
    )
    expect(screen.queryByLabelText(/data do pagamento/i)).toBeNull()
  })

  it('recusa valor zero no próprio formulário', async () => {
    const user = userEvent.setup()
    renderDialog()
    await waitForPaymentMethodsLoaded()
    await user.type(screen.getByRole('textbox', { name: /descrição/i }), 'Café')
    await user.type(screen.getByRole('textbox', { name: /valor/i }), '0,00')
    await user.click(screen.getByRole('button', { name: /criar transação/i }))
    await waitFor(() => expect(screen.getByText('Valor deve ser maior que zero')).toBeTruthy())
  })

  it('mostra no campo o erro de validação devolvido pela API (400 com fieldErrors)', async () => {
    server.use(
      http.post('*/transactions', () =>
        HttpResponse.json(
          {
            errorCode: 'VALIDATION_ERROR',
            message: 'Falha na validação da requisição.',
            fieldErrors: { description: 'Descrição recusada pelo servidor' },
          },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderDialog()
    await waitForPaymentMethodsLoaded()
    await user.type(screen.getByRole('textbox', { name: /descrição/i }), 'Café')
    await user.type(screen.getByRole('textbox', { name: /valor/i }), '12,50')
    await waitFor(() => {
      const select = screen.getByRole('combobox', { name: /^conta$/i })
      expect(select.querySelectorAll('option').length).toBeGreaterThan(1)
    })
    await user.selectOptions(screen.getByRole('combobox', { name: /^conta$/i }), 'account-1')
    await user.click(screen.getByRole('button', { name: /criar transação/i }))
    await waitFor(() => expect(screen.getByText('Descrição recusada pelo servidor')).toBeTruthy())
  })
})
