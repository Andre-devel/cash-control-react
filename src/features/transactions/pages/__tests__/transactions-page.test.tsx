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
    // Primeiro render do arquivo: com a suíte inteira em paralelo, passa de 1 s às vezes.
    await waitFor(
      () => {
        expect(screen.getByText(MOCK_TRANSACTION_1.description)).toBeTruthy()
        expect(screen.getByText(MOCK_TRANSACTION_2.description)).toBeTruthy()
      },
      { timeout: 5000 },
    )
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
    await waitFor(() => expect(screen.getByText(/nenhuma transação em/i)).toBeTruthy())
  })

  it('shows empty state with create CTA', async () => {
    server.use(
      http.get('*/transactions', () =>
        HttpResponse.json({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 }),
      ),
    )
    renderWithProviders(<TransactionsPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /ver todo o período/i })).toBeTruthy(),
    )
    expect(screen.getAllByRole('button', { name: /^nova transação$/i })).toHaveLength(2)
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

    await user.click(
      screen.getByRole('button', { name: `Ações de ${MOCK_TRANSACTION_1.description}` }),
    )
    await user.click(screen.getByRole('menuitem', { name: /cancelar transação/i }))

    await waitFor(() => expect(screen.getByRole('alertdialog')).toBeTruthy())
    expect(screen.getByRole('heading', { name: /cancelar transação/i })).toBeTruthy()
  })

  it('delete button opens confirmation dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)

    await waitFor(() => screen.getByText(MOCK_TRANSACTION_1.description))

    await user.click(
      screen.getByRole('button', { name: `Ações de ${MOCK_TRANSACTION_1.description}` }),
    )
    await user.click(screen.getByRole('menuitem', { name: /^excluir$/i }))

    await waitFor(() => expect(screen.getByRole('alertdialog')).toBeTruthy())
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
      expect(screen.getByText('Receitas')).toBeTruthy()
      expect(screen.getByText('Despesas')).toBeTruthy()
      expect(screen.getByText('Pag. de fatura')).toBeTruthy()
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

  it('o resumo vem do endpoint de totais, não da página carregada', async () => {
    server.use(
      http.get('*/transactions/summary', () =>
        HttpResponse.json({
          incomeAmount: '14923.11',
          incomeCount: 12,
          expenseAmount: '25136.62',
          expenseCount: 40,
          invoicePaymentAmount: '3235.79',
          invoicePaymentCount: 1,
          netAmount: '-10213.51',
        }),
      ),
    )
    const { container } = renderWithProviders(<TransactionsPage />)
    await waitFor(() => expect(container.textContent).toContain('14.923,11'))
    expect(container.textContent).toContain('25.136,62')
    // Pagamento de fatura ganhou cartão próprio nos totais, fora do resultado.
    const invoiceCard = screen.getByText('Pag. de fatura').parentElement!
    expect(invoiceCard.textContent).toMatch(/3\.235,79/)
    expect(invoiceCard.textContent).toMatch(/fora do resultado/i)
  })

  it('manda o mês atual como período e navega para o mês anterior', async () => {
    const seen: URLSearchParams[] = []
    server.use(
      http.get('*/transactions', ({ request }) => {
        seen.push(new URL(request.url).searchParams)
        return HttpResponse.json({
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 20,
        })
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)

    const now = new Date()
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    await waitFor(() => expect(seen.length).toBeGreaterThan(0))
    expect(seen[seen.length - 1].get('competenceDateFrom')).toBe(iso(first))

    await user.click(screen.getByRole('button', { name: 'Mês anterior' }))
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    await waitFor(() => expect(seen[seen.length - 1].get('competenceDateFrom')).toBe(iso(prev)))

    await user.click(screen.getByRole('button', { name: 'Todo o período' }))
    await waitFor(() => expect(seen[seen.length - 1].get('competenceDateFrom')).toBeNull())
  })

  it('a busca espera a digitação terminar e não perde letras', async () => {
    const searches: (string | null)[] = []
    server.use(
      http.get('*/transactions', ({ request }) => {
        searches.push(new URL(request.url).searchParams.get('searchText'))
        return HttpResponse.json({
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 20,
        })
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)
    const input = screen.getByRole('textbox', { name: /buscar por descrição/i })

    await user.type(input, 'hostinger')

    expect((input as HTMLInputElement).value).toBe('hostinger')
    await waitFor(() => expect(searches[searches.length - 1]).toBe('hostinger'))
    expect(searches.filter((s) => s !== null)).toEqual(['hostinger'])
  })

  it('reativa uma transação cancelada pelo menu', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionsPage />)
    await waitFor(() => screen.getByText(MOCK_TRANSACTION_1.description))
    await user.click(screen.getByRole('checkbox', { name: /incluir cancelados/i }))
    await waitFor(() => screen.getByText(MOCK_TRANSACTION_CANCELLED.description))

    await user.click(
      screen.getByRole('button', { name: `Ações de ${MOCK_TRANSACTION_CANCELLED.description}` }),
    )
    expect(screen.queryByRole('menuitem', { name: /editar/i })).toBeNull()
    await user.click(screen.getByRole('menuitem', { name: /reativar/i }))

    await waitFor(() => {
      const row = screen.getByText(MOCK_TRANSACTION_CANCELLED.description).closest('tr')!
      expect(row.textContent).toContain('Pendente')
    })
  })
})
