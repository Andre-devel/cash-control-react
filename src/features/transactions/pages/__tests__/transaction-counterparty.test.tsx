import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { createTestQueryClient, renderWithProviders } from '@/test/utils'
import { TransactionCard } from '@/features/transactions/components/transaction-card'
import TransactionDetailPage from '@/features/transactions/pages/transaction-detail-page'
import { ROUTES } from '@/app/router/routes'
import type { Transaction } from '@/features/transactions/types'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn(), action: vi.fn() },
}))

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-cp',
    description: 'Pix enviado',
    amount: '615.23',
    type: 'EXPENSE',
    status: 'PAID',
    accountId: 'acc-1',
    categoryId: null,
    competenceDate: '2026-11-03',
    paymentDate: '2026-11-03',
    createdAt: '2026-11-03T12:00:00Z',
    paymentMethod: { id: 'pm-pix', slug: 'PIX', name: 'Pix' },
    creditCard: null,
    accountName: 'Inter',
    counterpartyName: null,
    counterpartyDocument: null,
    ...overrides,
  }
}

const noop = vi.fn()

function renderCard(tx: Transaction) {
  return renderWithProviders(
    <TransactionCard
      transaction={tx}
      accounts={[]}
      categories={[]}
      onEdit={noop}
      onDelete={noop}
      onPay={noop}
      onCancel={noop}
      onReactivate={noop}
      onView={noop}
      onReimbursement={noop}
    />,
  )
}

function renderDetail(tx: Transaction) {
  server.use(http.get(`*/transactions/${tx.id}`, () => HttpResponse.json(tx)))
  const router = createMemoryRouter(
    [{ path: ROUTES.TRANSACTION_DETAIL, element: <TransactionDetailPage /> }],
    { initialEntries: [ROUTES.TRANSACTION_DETAIL.replace(':id', tx.id)] },
  )
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('contraparte no card da lista', () => {
  it('mostra "Para Fulano" na despesa', () => {
    renderCard(transaction({ counterpartyName: 'Fulano de Tal' }))
    expect(screen.getByText('Para Fulano de Tal')).toBeInTheDocument()
  })

  it('mostra "De Fulano" na receita', () => {
    renderCard(transaction({ type: 'INCOME', counterpartyName: 'Fulano de Tal' }))
    expect(screen.getByText('De Fulano de Tal')).toBeInTheDocument()
  })

  it('não mostra linha de contraparte quando ela não existe', () => {
    renderCard(transaction())
    expect(screen.getByText('Pix enviado')).toBeInTheDocument()
    expect(screen.queryByText(/^(Para|De) /)).not.toBeInTheDocument()
  })
})

describe('contraparte no detalhe da transação', () => {
  it('mostra o nome e o documento', async () => {
    renderDetail(
      transaction({ counterpartyName: 'Fulano de Tal', counterpartyDocument: '***.123.456-**' }),
    )
    expect(await screen.findByText('Para Fulano de Tal')).toBeInTheDocument()
    expect(screen.getByText('Contraparte')).toBeInTheDocument()
    expect(screen.getByText('CPF ***.123.456-**')).toBeInTheDocument()
  })

  it('identifica CNPJ pelo formato do documento', async () => {
    renderDetail(
      transaction({
        type: 'INCOME',
        counterpartyName: 'Empresa LTDA',
        counterpartyDocument: '12.345.678/0001-90',
      }),
    )
    expect(await screen.findByText('De Empresa LTDA')).toBeInTheDocument()
    expect(screen.getByText('CNPJ 12.345.678/0001-90')).toBeInTheDocument()
  })

  it('omite a contraparte quando ela não existe', async () => {
    renderDetail(transaction())
    expect(await screen.findByText('Forma de pagamento')).toBeInTheDocument()
    expect(screen.queryByText('Contraparte')).not.toBeInTheDocument()
  })
})
