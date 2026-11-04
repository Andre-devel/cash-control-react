import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useScopeStore } from '@/app/store/scope.store'
import { ScopeSelector } from '../scope-selector'
import { Topbar } from '../topbar'
import { ScopeBadge } from '@/components/ui/scope-badge'
import { CreateAccountDialog } from '@/features/accounts/components/create-account-dialog'
import { EditCardDialog } from '@/features/cards/components/edit-card-dialog'
import {
  CrossScopeBadge,
  TransactionScopeBadge,
} from '@/features/transactions/components/transaction-scope-badge'
import { describeTransaction } from '@/features/transactions/utils/transaction-display'
import type { Account } from '@/features/accounts/types'
import type { Card } from '@/features/cards/types'
import type { Transaction } from '@/features/transactions/types'

const { get, post, put } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }))

vi.mock('@/services/http', () => ({ axiosInstance: { get, post, put } }))

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: 'acc-pf',
    name: 'Nubank',
    type: 'CHECKING',
    scope: 'PERSONAL',
    balance: '100.00',
    currencyCode: 'BRL',
    sortOrder: 0,
    archivedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function card(overrides: Partial<Card> = {}): Card {
  return {
    id: 'card-pj',
    name: 'Cartão da empresa',
    brand: 'VISA',
    scope: 'BUSINESS',
    creditLimit: '5000.00',
    closingDay: 1,
    dueDay: 10,
    archivedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    description: 'Mercado',
    amount: '50.00',
    type: 'EXPENSE',
    status: 'PAID',
    accountId: 'acc-pf',
    categoryId: null,
    competenceDate: '2026-11-01',
    paymentDate: '2026-11-01',
    createdAt: '2026-11-01T00:00:00Z',
    paymentMethod: { id: 'pm', slug: 'PIX', name: 'Pix' } as Transaction['paymentMethod'],
    creditCard: null,
    ...overrides,
  }
}

/** Respostas do GET por URL: contas e cartões que o seletor usa para decidir se aparece. */
function serve(accounts: Account[], cards: Card[]) {
  get.mockImplementation((url: string) =>
    Promise.resolve({ data: url === '/accounts' ? accounts : url === '/cards' ? cards : [] }),
  )
}

function renderWithClient(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  get.mockReset()
  post.mockReset()
  put.mockReset()
  useScopeStore.setState({ scope: 'ALL' })
})

afterEach(() => {
  cleanup()
})

describe('ScopeSelector', () => {
  it('stays hidden when the user has no business account or card', async () => {
    serve([account()], [card({ scope: 'PERSONAL' })])
    renderWithClient(<ScopeSelector />)
    await waitFor(() => expect(get).toHaveBeenCalledWith('/cards', { params: {} }))
    expect(screen.queryByRole('radiogroup')).toBeNull()
  })

  it('goes back to "Tudo" when the stored filter has no business account behind it', async () => {
    useScopeStore.setState({ scope: 'BUSINESS' })
    serve([account()], [])
    renderWithClient(<ScopeSelector />)
    await waitFor(() => expect(useScopeStore.getState().scope).toBe('ALL'))
  })

  it('shows PF / PJ / Tudo when there is a business card, and switches the filter', async () => {
    const user = userEvent.setup()
    serve([account()], [card()])
    renderWithClient(<ScopeSelector />)
    const group = await screen.findByRole('radiogroup', { name: /escopo/i })
    expect(group).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'Tudo' })).toHaveAttribute('aria-checked', 'true')

    await user.click(screen.getByRole('radio', { name: 'PJ' }))
    expect(useScopeStore.getState().scope).toBe('BUSINESS')
    expect(screen.getByRole('radio', { name: 'PJ' })).toHaveAttribute('aria-checked', 'true')
  })

  it('is rendered by the topbar when asked', async () => {
    serve([account({ scope: 'BUSINESS' })], [])
    renderWithClient(<Topbar title="Início" scopeFilter />)
    expect(await screen.findByRole('radio', { name: 'PF' })).toBeTruthy()
  })
})

describe('scope field in the forms', () => {
  it('sends the chosen scope when creating an account', async () => {
    const user = userEvent.setup()
    post.mockResolvedValue({ data: account() })
    renderWithClient(<CreateAccountDialog open onClose={vi.fn()} />)

    await user.type(screen.getByPlaceholderText('ex: Nubank'), 'Conta PJ')
    const select = screen.getByRole('combobox', { name: 'Escopo' })
    expect(select).toHaveValue('PERSONAL')
    await user.selectOptions(select, 'BUSINESS')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        '/accounts',
        expect.objectContaining({ name: 'Conta PJ', scope: 'BUSINESS' }),
      ),
    )
  })

  it('loads and sends the scope of the card being edited', async () => {
    const user = userEvent.setup()
    put.mockResolvedValue({ data: card() })
    renderWithClient(<EditCardDialog card={card()} open onClose={vi.fn()} />)

    const select = screen.getByRole('combobox', { name: 'Escopo' })
    expect(select).toHaveValue('BUSINESS')
    expect(screen.getByRole('option', { name: 'Pessoal' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Empresa' })).toBeTruthy()
    await user.selectOptions(select, 'PERSONAL')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() =>
      expect(put).toHaveBeenCalledWith(
        '/cards/card-pj',
        expect.objectContaining({ scope: 'PERSONAL' }),
      ),
    )
  })
})

describe('PJ badge and owner draw label', () => {
  it('shows "PJ" on business items only while the filter is "Tudo"', () => {
    const { rerender } = render(<ScopeBadge scope="BUSINESS" />)
    expect(screen.getByText('PJ')).toBeTruthy()

    rerender(<ScopeBadge scope="PERSONAL" />)
    expect(screen.queryByText('PJ')).toBeNull()

    useScopeStore.setState({ scope: 'BUSINESS' })
    rerender(<ScopeBadge scope="BUSINESS" />)
    expect(screen.queryByText('PJ')).toBeNull()
  })

  it('takes the transaction scope from the account, or from the card on a card purchase', async () => {
    serve([], [card()])
    const accounts = [account(), account({ id: 'acc-pj', scope: 'BUSINESS' })]
    renderWithClient(
      <>
        <div data-testid="pf">
          <TransactionScopeBadge transaction={transaction()} accounts={accounts} />
        </div>
        <div data-testid="pj-account">
          <TransactionScopeBadge
            transaction={transaction({ accountId: 'acc-pj' })}
            accounts={accounts}
          />
        </div>
        <div data-testid="pj-card">
          <TransactionScopeBadge
            transaction={transaction({
              creditCard: { id: 'card-pj', name: 'Cartão da empresa', brand: 'VISA' },
            })}
            accounts={accounts}
          />
        </div>
      </>,
    )
    expect(screen.getByTestId('pf').textContent).toBe('')
    expect(screen.getByTestId('pj-account').textContent).toBe('PJ')
    await waitFor(() => expect(screen.getByTestId('pj-card').textContent).toBe('PJ'))
  })

  it('labels a cross-scope transfer "Pró-labore / aporte"', () => {
    const transfer = transaction({ type: 'TRANSFER', crossScope: true })
    render(<CrossScopeBadge transaction={transfer} />)
    expect(screen.getByText('Pró-labore / aporte')).toBeTruthy()
    expect(describeTransaction(transfer, [], []).typeLabel).toBe('Pró-labore / aporte')
  })

  it('keeps the usual label on a transfer inside the same scope', () => {
    const transfer = transaction({ type: 'TRANSFER', crossScope: false })
    const { container } = render(<CrossScopeBadge transaction={transfer} />)
    expect(container.textContent).toBe('')
    expect(describeTransaction(transfer, [], []).typeLabel).not.toBe('Pró-labore / aporte')
  })
})
