import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import {
  MOCK_RECENT_TRANSACTIONS,
  MOCK_UPCOMING_BILLS,
  MOCK_UPCOMING_INVOICES,
  dashboardHandlers,
} from '@/test/handlers/dashboard.handlers'
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
      expect(screen.getByText('Patrimônio total')).toBeTruthy()
      expect(screen.getByText('Saldo do mês')).toBeTruthy()
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

  it('renders period tabs with Mês selected by default', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      const tablist = screen.getByRole('tablist', { name: /período/i })
      expect(tablist).toBeTruthy()
    })
    const selectedTab = screen.getByRole('tab', { name: /mês/i })
    expect(selectedTab.getAttribute('aria-selected')).toBe('true')
  })

  it('renders KPI section with Saldo calculation (income minus expenses)', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('Saldo do mês')).toBeTruthy()
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
      expect(screen.getByText('Faturas em aberto')).toBeTruthy()
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

  it('MOCK_OVERVIEW totalBalance value is formatted and displayed', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('Patrimônio total')).toBeTruthy()
    })
    expect(screen.getByText(/12\.500/)).toBeTruthy()
  })
})
