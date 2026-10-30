import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup, fireEvent } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import {
  MOCK_EMPTY_INVESTMENT_SUMMARY,
  MOCK_OVERVIEW,
  MOCK_RECENT_TRANSACTIONS,
  MOCK_UPCOMING_BILLS,
  MOCK_UPCOMING_INVOICES,
  dashboardHandlers,
} from '@/test/handlers/dashboard.handlers'
import { useDiscountInvoicesStore } from '@/lib/discount-invoices'
import DashboardPage from '../dashboard-page'

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
  vi.clearAllMocks()
  server.use(...dashboardHandlers)
  useDiscountInvoicesStore.setState({ discount: false })
})

afterEach(() => {
  cleanup()
})

describe('DashboardPage', () => {
  it('renders the page heading with user greeting', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => expect(screen.getByRole('heading', { name: /olá/i })).toBeTruthy())
  })

  it('shows loading skeleton for KPI section', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByLabelText('Carregando resumo')).toBeTruthy()
  })

  it('renders KPI cards with correct labels after overview loads', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('Patrimônio líquido')).toBeTruthy()
      expect(screen.getByText(/^Saldo de /)).toBeTruthy()
    })
  })

  it('renders bar chart card after monthly chart loads', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('Receitas vs Despesas')).toBeTruthy()
    })
  })

  it('renders upcoming bills card when API returns a plain array', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText(MOCK_UPCOMING_BILLS[0].description)).toBeTruthy()
    })
  })

  it('renders open invoices card when API returns a plain array', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText(MOCK_UPCOMING_INVOICES[0].cardName)).toBeTruthy()
    })
  })

  it('renders recent transactions card when API returns a plain array', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText(MOCK_RECENT_TRANSACTIONS[0].description)).toBeTruthy()
    })
  })

  it('KPI section shows error message when overview API fails', async () => {
    server.use(
      http.get('*/dashboard/overview', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    renderWithProviders(<DashboardPage />)
    await waitFor(() => expect(screen.getByText(/erro ao carregar resumo/i)).toBeTruthy())
  })

  it('overview error does not affect other cards', async () => {
    server.use(
      http.get('*/dashboard/overview', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText(/erro ao carregar resumo/i)).toBeTruthy()
      expect(screen.getByText(MOCK_RECENT_TRANSACTIONS[0].description)).toBeTruthy()
    })
  })

  it('recent transactions error does not affect other cards', async () => {
    server.use(
      http.get('*/dashboard/widgets/recent-transactions', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText(/erro ao carregar transações recentes/i)).toBeTruthy()
      expect(screen.getByText(MOCK_UPCOMING_BILLS[0].description)).toBeTruthy()
    })
  })

  it('upcoming bills shows overdue indicator for OVERDUE status bills', async () => {
    server.use(
      http.get('*/dashboard/widgets/upcoming-bills', () =>
        HttpResponse.json([
          {
            id: 'overdue-1',
            description: 'Conta Vencida',
            amount: '100.00',
            paymentDate: '2020-01-01',
            accountName: 'Corrente',
            status: 'OVERDUE',
          },
        ]),
      ),
    )
    renderWithProviders(<DashboardPage />)
    await waitFor(() => expect(screen.getByText('Conta Vencida')).toBeTruthy())
    expect(screen.getAllByText(/vencida/i).length).toBeGreaterThanOrEqual(1)
  })

  it('open invoices card link navigates to card detail page', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => expect(screen.getByText(MOCK_UPCOMING_INVOICES[0].cardName)).toBeTruthy())
    const link = screen.getByRole('link', {
      name: new RegExp(MOCK_UPCOMING_INVOICES[0].cardName, 'i'),
    })
    expect(link.getAttribute('href')).toContain('/cards')
  })

  it('recent transactions shows empty state when list is empty', async () => {
    server.use(http.get('*/dashboard/widgets/recent-transactions', () => HttpResponse.json([])))
    renderWithProviders(<DashboardPage />)
    await waitFor(() => expect(screen.getByText(/nenhuma transação recente/i)).toBeTruthy())
  })

  it('upcoming bills shows empty state when list is empty', async () => {
    server.use(http.get('*/dashboard/widgets/upcoming-bills', () => HttpResponse.json([])))
    renderWithProviders(<DashboardPage />)
    await waitFor(() => expect(screen.getByText(/nenhuma conta/i)).toBeTruthy())
  })

  it('period tabs belong to the chart, with 6 months by default', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByRole('tablist', { name: /período do gráfico/i })).toBeTruthy()
    })
    expect(screen.getByRole('tab', { name: '6m' }).getAttribute('aria-selected')).toBe('true')
  })

  it('KPIs compare with the previous month and use net worth', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => expect(screen.getByText(/\+25% vs/)).toBeTruthy())
    // Despesa caiu 20%: seta para baixo, mas cor de "bom".
    const expenses = screen.getByText(/−20% vs|-20% vs/)
    expect(expenses.className).toContain('up')
    expect(screen.getByText(/desde/).textContent).toMatch(/\+R\$\s1\.000,00 desde/)
    expect(screen.getAllByText('15.000').length).toBeGreaterThan(0)
  })

  it('renders KPI section with Saldo calculation (income minus expenses)', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText(/^Saldo de /)).toBeTruthy()
    })
    expect(screen.getByText('Receitas − Despesas')).toBeTruthy()
  })

  it('renders monthly chart with KPI data side by side', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('Receitas vs Despesas')).toBeTruthy()
      expect(screen.getByText('Próximas contas')).toBeTruthy()
    })
  })

  it('renders bottom row with open invoices and recent transactions', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('Faturas a pagar')).toBeTruthy()
      expect(screen.getByText('Transações recentes')).toBeTruthy()
    })
  })

  it('upcoming bills error shows retry button', async () => {
    server.use(
      http.get('*/dashboard/widgets/upcoming-bills', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    renderWithProviders(<DashboardPage />)
    await waitFor(() => expect(screen.getByText(/erro ao carregar próximas contas/i)).toBeTruthy())
    expect(screen.getByText(/tentar novamente/i)).toBeTruthy()
  })

  it('MOCK_OVERVIEW netWorth value is formatted and displayed', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('Patrimônio líquido')).toBeTruthy()
    })
    expect(screen.getByText(/15\.000/)).toBeTruthy()
  })
  it('hides the investments card without an investment account', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => expect(screen.getByText('Patrimônio líquido')).toBeTruthy())
    expect(screen.queryByRole('region', { name: 'Investimentos' })).toBeNull()
  })

  it('shows the investments card with the month yield and the next maturity', async () => {
    server.use(
      http.get('*/dashboard/overview', () =>
        HttpResponse.json({ ...MOCK_OVERVIEW, investmentsYieldMonth: '12.34' }),
      ),
      http.get('*/investments/summary', () =>
        HttpResponse.json({
          ...MOCK_EMPTY_INVESTMENT_SUMMARY,
          totalGross: '1072.41',
          totalNet: '1057.93',
          upcomingMaturities: [
            { holdingId: 'h-1', name: 'CDB Banco X', maturityDate: '2026-12-15', net: '1057.93' },
          ],
          accounts: [
            {
              accountId: 'inv-1',
              accountName: 'Investimentos',
              balance: '1000',
              allocatedPrincipal: '1000',
              unallocated: '0',
            },
          ],
        }),
      ),
    )
    renderWithProviders(<DashboardPage />)
    const card = await screen.findByRole('region', { name: 'Investimentos' })
    expect(card.textContent).toContain('1.072')
    expect(card.textContent).toMatch(/\+R\$\s?12,34/)
    expect(card.textContent).toContain('CDB Banco X')
    expect(screen.getByRole('link', { name: 'Ver investimentos' }).getAttribute('href')).toBe(
      '/investments',
    )
  })

  it('discounts open invoices from net worth when the switch is on', async () => {
    server.use(
      http.get('*/dashboard/overview', () =>
        HttpResponse.json({ ...MOCK_OVERVIEW, openCardDebt: '2500.00' }),
      ),
    )
    renderWithProviders(<DashboardPage />)
    const toggle = await screen.findByRole('switch', { name: /descontar faturas em aberto/i })
    expect(toggle.getAttribute('aria-checked')).toBe('false')

    fireEvent.click(toggle)

    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true')
    expect(screen.getAllByText('12.500').length).toBeGreaterThan(0)
    expect(screen.getByText(/já descontando/).textContent).toMatch(/2\.500,00 de faturas/)
    // A variação continua sobre o patrimônio sem desconto.
    expect(screen.getByText(/desde/).textContent).toMatch(/\+R\$\s1\.000,00 desde/)
    expect(localStorage.getItem('cash-control-react:discount-invoices')).toBe('1')
  })

  it('has no discount switch without open invoices', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => expect(screen.getByText('Patrimônio líquido')).toBeTruthy())
    expect(screen.queryByRole('switch')).toBeNull()
  })
})
