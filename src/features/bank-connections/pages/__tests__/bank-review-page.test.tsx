import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import BankReviewPage from '../bank-review-page'
import type { BankPendingItem } from '@/features/bank-connections/types'
import type { ImportPreviewRow } from '@/features/transactions/types'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
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
