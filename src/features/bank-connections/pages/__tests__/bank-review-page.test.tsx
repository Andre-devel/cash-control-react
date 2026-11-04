import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { toast } from '@/lib/toast'
import BankReviewPage from '../bank-review-page'
import type { BankPendingItem } from '@/features/bank-connections/types'
import type { ImportPreviewRow } from '@/features/transactions/types'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn(), action: vi.fn() },
}))

function row(overrides: Partial<ImportPreviewRow>): ImportPreviewRow {
  return {
    lineNumber: 1,
    externalRef: 'plg:t1',
    date: '2026-10-30',
    description: 'PADARIA SAO JOAO',
    rawHistory: 'Pix enviado',
    amount: '10.00',
    type: 'EXPENSE',
    paymentMethod: 'PIX',
    merchantKey: 'padaria sao joao',
    suggestedDescription: 'Padaria',
    suggestedCategoryId: null,
    suggestedCategoryName: null,
    suggestedSubcategoryId: null,
    suggestedSubcategoryName: null,
    suggestionSource: 'NONE',
    duplicate: false,
    unknownHistory: false,
    outgoing: true,
    transferAccountId: null,
    transferAccountName: null,
    invoiceId: null,
    invoiceLabel: null,
    invoiceAmountMismatch: false,
    invoiceOptions: [],
    investment: false,
    invoicePaymentUnmatched: false,
    possibleDuplicate: false,
    counterpartyName: null,
    counterpartyDocument: null,
    ...overrides,
  }
}

const ITEMS: BankPendingItem[] = [
  { id: 'p-1', accountId: 'acc-1', accountName: 'Inter', row: row({}) },
  {
    id: 'p-2',
    accountId: 'acc-1',
    accountName: 'Inter',
    row: row({
      externalRef: 'plg:t2',
      description: 'FULANO DE TAL',
      rawHistory: 'Pix recebido',
      suggestedDescription: null,
      type: 'INCOME',
      outgoing: false,
      amount: '50.00',
    }),
  },
]

function mockQueue(items: BankPendingItem[]) {
  server.use(http.get('*/bank-pending', () => HttpResponse.json(items)))
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('BankReviewPage', () => {
  it('shows one transaction at a time with the suggested name', async () => {
    mockQueue(ITEMS)
    renderWithProviders(<BankReviewPage />)

    expect(await screen.findByText(/1 de 2 · Inter/)).toBeInTheDocument()
    expect(screen.getByText('Pix enviado')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toHaveValue('Padaria')
    // O texto do banco continua visível quando o nome sugerido é outro.
    expect(screen.getByText('PADARIA SAO JOAO')).toBeInTheDocument()
  })

  it('shows the counterparty name and document from the bank', async () => {
    mockQueue([
      {
        id: 'p-3',
        accountId: 'acc-1',
        accountName: 'Inter',
        row: row({ counterpartyName: 'Fulano de Tal', counterpartyDocument: '***.123.456-**' }),
      },
      {
        id: 'p-4',
        accountId: 'acc-1',
        accountName: 'Inter',
        row: row({ externalRef: 'plg:t4', outgoing: false, type: 'INCOME' }),
      },
    ])
    renderWithProviders(<BankReviewPage />)

    expect(await screen.findByText('Para Fulano de Tal · CPF ***.123.456-**')).toBeInTheDocument()
  })

  it('shows "De" on incoming money', async () => {
    mockQueue([
      {
        id: 'p-5',
        accountId: 'acc-1',
        accountName: 'Inter',
        row: row({ type: 'INCOME', outgoing: false, counterpartyName: 'Beltrano' }),
      },
    ])
    renderWithProviders(<BankReviewPage />)
    expect(await screen.findByText('De Beltrano')).toBeInTheDocument()
  })

  it('omits the counterparty line when the bank did not send one', async () => {
    mockQueue(ITEMS)
    renderWithProviders(<BankReviewPage />)
    expect(await screen.findByText(/1 de 2 · Inter/)).toBeInTheDocument()
    expect(screen.queryByText(/^(Para|De) /)).not.toBeInTheDocument()
  })

  it('skips to the next one, keeping the skipped at the end', async () => {
    mockQueue(ITEMS)
    const user = userEvent.setup()
    renderWithProviders(<BankReviewPage />)

    await user.click(await screen.findByRole('button', { name: /Pular/ }))

    expect(screen.getByText('Pix recebido')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toHaveValue('FULANO DE TAL')
  })

  it('confirms with the edited name, keeping the bank key, date and amount', async () => {
    mockQueue(ITEMS)
    let body: Record<string, unknown> | undefined
    server.use(
      http.post('*/bank-pending/p-1/confirm', async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ description: 'Pão', categoryName: null })
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<BankReviewPage />)

    const name = await screen.findByLabelText('Nome')
    await user.clear(name)
    await user.type(name, 'Pão')
    await user.click(screen.getByRole('button', { name: /Confirmar e próximo/ }))

    await waitFor(() =>
      expect(body).toMatchObject({
        externalRef: 'plg:t1',
        date: '2026-10-30',
        amount: '10.00',
        description: 'Pão',
        originalDescription: 'PADARIA SAO JOAO',
        type: 'EXPENSE',
        counterpartyName: null,
      }),
    )
  })

  it('discards and confirms all as suggested', async () => {
    mockQueue(ITEMS)
    let discarded = false
    let confirmedAll = false
    server.use(
      http.delete('*/bank-pending/p-1', () => {
        discarded = true
        return new HttpResponse(null, { status: 204 })
      }),
      http.post('*/bank-pending/confirm-all', () => {
        confirmedAll = true
        return HttpResponse.json({ confirmed: 2, skipped: 0 })
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<BankReviewPage />)

    await user.click(await screen.findByRole('button', { name: /Descartar/ }))
    await waitFor(() => expect(discarded).toBe(true))
    await user.click(screen.getByRole('button', { name: /Confirmar todos como sugerido/ }))
    await waitFor(() => expect(confirmedAll).toBe(true))
  })

  it('says when there is nothing to review', async () => {
    mockQueue([])
    renderWithProviders(<BankReviewPage />)

    expect(await screen.findByText('Tudo revisado')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Confirmar todos/ })).not.toBeInTheDocument()
  })
})

describe('BankReviewPage — regra a partir da correção', () => {
  const PIX_ITEM: BankPendingItem = {
    id: 'p-1',
    accountId: 'account-1',
    accountName: 'Nubank',
    row: row({
      description: 'PIX ENVIADO',
      counterpartyName: 'Padaria Sao Joao Ltda',
      suggestedDescription: null,
    }),
  }

  function mockConfirm() {
    server.use(
      http.post('*/bank-pending/p-1/confirm', () =>
        HttpResponse.json({ description: 'PIX ENVIADO', categoryName: 'Food' }),
      ),
    )
  }

  async function confirmWithCategory(user: ReturnType<typeof userEvent.setup>, name?: string) {
    if (name) {
      await user.click(await screen.findByRole('combobox', { name: /categoria/i }))
      await user.click(await screen.findByRole('option', { name }))
    }
    await user.click(await screen.findByRole('button', { name: /Confirmar e próximo/ }))
  }

  it('offers the rule after confirming with a category other than the suggested one', async () => {
    mockQueue([PIX_ITEM])
    mockConfirm()
    const user = userEvent.setup()
    renderWithProviders(<BankReviewPage />)

    await confirmWithCategory(user, 'Food')

    await waitFor(() =>
      expect(toast.action).toHaveBeenCalledWith(
        'Tudo com «PADARIA SAO JOAO LTDA» vai para Food?',
        expect.objectContaining({ label: 'Criar regra' }),
        expect.anything(),
      ),
    )
  })

  it('does not offer a rule when confirming the suggestion as is', async () => {
    mockQueue([
      {
        ...PIX_ITEM,
        row: { ...PIX_ITEM.row, suggestedCategoryId: 'cat-1', suggestedCategoryName: 'Food' },
      },
    ])
    mockConfirm()
    const user = userEvent.setup()
    renderWithProviders(<BankReviewPage />)

    await confirmWithCategory(user)

    await waitFor(() => expect(toast.success).toHaveBeenCalled())
    expect(toast.action).not.toHaveBeenCalled()
  })

  it('does not offer a rule when the suggestion already came from one', async () => {
    mockQueue([
      {
        ...PIX_ITEM,
        row: {
          ...PIX_ITEM.row,
          suggestedCategoryId: 'cat-2',
          suggestedCategoryName: 'Salary',
          suggestionSource: 'RULE',
        },
      },
    ])
    mockConfirm()
    const user = userEvent.setup()
    renderWithProviders(<BankReviewPage />)

    await confirmWithCategory(user, 'Food')

    await waitFor(() => expect(toast.success).toHaveBeenCalled())
    expect(toast.action).not.toHaveBeenCalled()
  })

  it('opens the dialog prefilled and re-reads the queue once the rule is created', async () => {
    let listCalls = 0
    server.use(
      http.get('*/bank-pending', () => {
        listCalls += 1
        return HttpResponse.json([PIX_ITEM])
      }),
    )
    mockConfirm()
    const user = userEvent.setup()
    renderWithProviders(<BankReviewPage />)

    await confirmWithCategory(user, 'Food')
    await waitFor(() => expect(toast.action).toHaveBeenCalled())
    const [, action] = vi.mocked(toast.action).mock.calls[0]
    await act(async () => action.onClick())

    const dialog = within(await screen.findByRole('dialog', { name: /nova regra/i }))
    expect(dialog.getByPlaceholderText(/supermercado/i)).toHaveValue('PADARIA SAO JOAO LTDA')
    expect(dialog.getByRole('combobox', { name: 'Categoria' })).toHaveValue('cat-1')
    await waitFor(() =>
      expect(dialog.getByRole('combobox', { name: 'Conta' })).toHaveValue('account-1'),
    )

    const before = listCalls
    await user.click(dialog.getByRole('button', { name: 'Criar regra' }))
    await waitFor(() => expect(listCalls).toBeGreaterThan(before))
  })
})
