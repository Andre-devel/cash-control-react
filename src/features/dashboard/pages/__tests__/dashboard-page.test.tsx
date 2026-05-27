import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import {
  MOCK_OVERVIEW,
  MOCK_RECENT_TRANSACTIONS,
  MOCK_UPCOMING_BILLS,
  MOCK_UPCOMING_INVOICES,
  MOCK_LARGEST_EXPENSES,
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
  // Register dashboard handlers first so they take precedence over the generic
  // "*/categories" handler that otherwise matches "*/dashboard/charts/categories".
  server.use(...dashboardHandlers)
})

afterEach(() => {
  cleanup()
})

describe('DashboardPage', () => {
  it('renders the page heading', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => expect(screen.getByRole('heading', { name: /dashboard/i })).toBeTruthy())
  })

  it('shows loading skeleton for overview section', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByLabelText('Loading overview')).toBeTruthy()
  })

  it('renders overview section with correct totals after loading', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('Total Balance')).toBeTruthy()
      expect(screen.getByText('Monthly Income')).toBeTruthy()
      expect(screen.getByText('Monthly Expenses')).toBeTruthy()
      expect(screen.getByText('Active Accounts')).toBeTruthy()
    })
    expect(screen.getByText(String(MOCK_OVERVIEW.activeAccountsCount))).toBeTruthy()
  })

  it('renders upcoming bills widget after loading', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText(MOCK_UPCOMING_BILLS.bills[0].description)).toBeTruthy()
    })
  })

  it('renders upcoming invoices widget after loading', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText(MOCK_UPCOMING_INVOICES.invoices[0].cardName)).toBeTruthy()
    })
  })

  it('renders largest expenses widget after loading', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText(MOCK_LARGEST_EXPENSES.expenses[0].description)).toBeTruthy()
    })
  })

  it('renders recent transactions widget after loading', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText(MOCK_RECENT_TRANSACTIONS.transactions[0].description)).toBeTruthy()
    })
  })

  it('overview section shows error message when API fails', async () => {
    server.use(
      http.get('*/dashboard/overview', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    renderWithProviders(<DashboardPage />)
    await waitFor(() => expect(screen.getByText(/failed to load financial overview/i)).toBeTruthy())
  })

  it('overview error boundary fallback does not affect other widgets', async () => {
    server.use(
      http.get('*/dashboard/overview', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText(/failed to load financial overview/i)).toBeTruthy()
      expect(screen.getByText(MOCK_RECENT_TRANSACTIONS.transactions[0].description)).toBeTruthy()
    })
  })

  it('widget error boundary isolates failure — other widgets remain visible', async () => {
    server.use(
      http.get('*/dashboard/widgets/recent-transactions', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText(/failed to load recent transactions/i)).toBeTruthy()
      expect(screen.getByText(MOCK_UPCOMING_BILLS.bills[0].description)).toBeTruthy()
    })
  })

  it('upcoming bills show overdue indicator for past due dates', async () => {
    server.use(
      http.get('*/dashboard/widgets/upcoming-bills', () =>
        HttpResponse.json({
          bills: [
            {
              id: 'overdue-1',
              description: 'Overdue Bill',
              amount: '100.00',
              dueDate: '2020-01-01',
              accountId: 'account-1',
              accountName: 'Checking',
            },
          ],
        }),
      ),
    )
    renderWithProviders(<DashboardPage />)
    await waitFor(() => expect(screen.getByText('Overdue Bill')).toBeTruthy())
    expect(screen.getAllByText(/overdue/i).length).toBeGreaterThanOrEqual(1)
  })

  it('upcoming invoices link navigates to card detail page', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() =>
      expect(screen.getByText(MOCK_UPCOMING_INVOICES.invoices[0].cardName)).toBeTruthy(),
    )
    const link = screen.getByRole('link', {
      name: new RegExp(MOCK_UPCOMING_INVOICES.invoices[0].cardName, 'i'),
    })
    expect(link.getAttribute('href')).toContain(MOCK_UPCOMING_INVOICES.invoices[0].cardId)
  })

  it('largest expenses link navigates to transaction detail page', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() =>
      expect(screen.getByText(MOCK_LARGEST_EXPENSES.expenses[0].description)).toBeTruthy(),
    )
    const link = screen.getByRole('link', {
      name: new RegExp(MOCK_LARGEST_EXPENSES.expenses[0].description, 'i'),
    })
    expect(link.getAttribute('href')).toContain(MOCK_LARGEST_EXPENSES.expenses[0].id)
  })

  it('recent transactions show empty state when list is empty', async () => {
    server.use(
      http.get('*/dashboard/widgets/recent-transactions', () =>
        HttpResponse.json({ transactions: [] }),
      ),
    )
    renderWithProviders(<DashboardPage />)
    await waitFor(() => expect(screen.getByText(/no recent transactions/i)).toBeTruthy())
  })

  it('upcoming bills show empty state when list is empty', async () => {
    server.use(
      http.get('*/dashboard/widgets/upcoming-bills', () => HttpResponse.json({ bills: [] })),
    )
    renderWithProviders(<DashboardPage />)
    await waitFor(() => expect(screen.getByText(/no upcoming bills/i)).toBeTruthy())
  })
})
