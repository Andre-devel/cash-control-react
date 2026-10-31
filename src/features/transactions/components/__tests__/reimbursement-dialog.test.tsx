import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import type { SetReimbursementRequest, Transaction } from '@/features/transactions/types'
import { ReimbursementDialog } from '../reimbursement-dialog'
import { TransactionActions } from '../transaction-actions'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-taxi',
    description: 'Táxi',
    amount: '100.00',
    type: 'EXPENSE',
    status: 'PAID',
    accountId: 'acc-1',
    categoryId: null,
    competenceDate: '2026-10-01',
    paymentDate: '2026-10-01',
    createdAt: '2026-10-01T12:00:00Z',
    paymentMethod: { id: 'pm-1', slug: 'PIX', name: 'Pix' },
    creditCard: null,
    reimbursement: null,
    ...overrides,
  }
}

function givenServer(candidates: Transaction[]) {
  let sent: SetReimbursementRequest | null = null
  server.use(
    http.get('*/transactions/tx-taxi/reimbursement/candidates', () =>
      HttpResponse.json(candidates),
    ),
    http.put('*/transactions/tx-taxi/reimbursement', async ({ request }) => {
      sent = (await request.json()) as SetReimbursementRequest
      return HttpResponse.json(
        tx({
          reimbursement: {
            reimbursable: true,
            linkedTransactionId: null,
            linkedDescription: null,
            linkedAmount: null,
          },
        }),
      )
    }),
  )
  return () => sent
}

afterEach(() => cleanup())

describe('ReimbursementDialog', () => {
  it('marks the expense as reimbursable without linking', async () => {
    const sent = givenServer([])
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<ReimbursementDialog transaction={tx()} onClose={onClose} />)

    expect(await screen.findByText(/nenhuma receita sem vínculo/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /marcar como reembolsável/i }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(sent()).toEqual({ reimbursable: true, reimbursedById: null })
  })

  it('links a candidate income', async () => {
    const sent = givenServer([
      tx({ id: 'tx-back', type: 'INCOME', description: 'Reembolso táxi', amount: '80.00' }),
    ])
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<ReimbursementDialog transaction={tx()} onClose={onClose} />)

    await user.click(await screen.findByRole('button', { name: /vincular reembolso táxi/i }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(sent()).toEqual({ reimbursable: true, reimbursedById: 'tx-back' })
  })

  it('shows the linked income and what did not come back, and can unlink', async () => {
    const sent = givenServer([])
    const user = userEvent.setup()
    renderWithProviders(
      <ReimbursementDialog
        transaction={tx({
          reimbursement: {
            reimbursable: true,
            linkedTransactionId: 'tx-back',
            linkedDescription: 'Reembolso táxi',
            linkedAmount: '80.00',
          },
        })}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByText('Reembolso táxi')).toBeInTheDocument()
    expect(screen.getByText(/não voltaram e continuam contando como gasto/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /desvincular/i }))

    await waitFor(() => expect(sent()).toEqual({ reimbursable: true, reimbursedById: null }))
  })
})

describe('TransactionActions reimbursement item', () => {
  const handlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onPay: vi.fn(),
    onCancel: vi.fn(),
    onReactivate: vi.fn(),
    onView: vi.fn(),
  }

  it('offers it on an expense and calls the handler', async () => {
    const onReimbursement = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <TransactionActions transaction={tx()} {...handlers} onReimbursement={onReimbursement} />,
    )

    await user.click(screen.getByRole('button', { name: /ações de táxi/i }))
    await user.click(await screen.findByRole('menuitem', { name: /marcar como reembolsável/i }))

    expect(onReimbursement).toHaveBeenCalledWith(expect.objectContaining({ id: 'tx-taxi' }))
  })

  it('hides it on an income and on an installment', async () => {
    const user = userEvent.setup()
    const { unmount } = renderWithProviders(
      <TransactionActions
        transaction={tx({ type: 'INCOME' })}
        {...handlers}
        onReimbursement={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: /ações de táxi/i }))
    expect(screen.queryByRole('menuitem', { name: /reembols/i })).not.toBeInTheDocument()
    unmount()

    renderWithProviders(
      <TransactionActions
        transaction={tx({ installmentSeriesId: 'series-1', installmentNumber: 1 })}
        {...handlers}
        onReimbursement={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: /ações de táxi/i }))
    expect(screen.queryByRole('menuitem', { name: /reembols/i })).not.toBeInTheDocument()
  })
})
