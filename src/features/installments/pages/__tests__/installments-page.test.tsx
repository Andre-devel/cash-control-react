import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import {
  MOCK_SERIES_1,
  MOCK_SERIES_2,
  resetInstallmentsStore,
} from '@/test/handlers/installments.handlers'
import InstallmentsPage from '../installments-page'

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
  resetInstallmentsStore()
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('InstallmentsPage', () => {
  it('renders the page heading', async () => {
    renderWithProviders(<InstallmentsPage />)
    await waitFor(() => expect(screen.getByRole('heading', { name: /installments/i })).toBeTruthy())
  })

  it('shows a loading skeleton while fetching', () => {
    renderWithProviders(<InstallmentsPage />)
    expect(screen.getByLabelText('Loading installments')).toBeTruthy()
  })

  it('renders the list of installment series after loading', async () => {
    renderWithProviders(<InstallmentsPage />)
    await waitFor(() => {
      expect(screen.getByText(MOCK_SERIES_1.description)).toBeTruthy()
      expect(screen.getByText(MOCK_SERIES_2.description)).toBeTruthy()
    })
  })

  it('shows paid/total progress for each series', async () => {
    renderWithProviders(<InstallmentsPage />)
    await waitFor(() => {
      expect(
        screen.getByText(`${MOCK_SERIES_1.paidCount}/${MOCK_SERIES_1.installmentCount} paid`),
      ).toBeTruthy()
    })
  })

  it('shows progress bar for paid installments', async () => {
    renderWithProviders(<InstallmentsPage />)
    await waitFor(() => {
      const progressBars = screen.getAllByRole('progressbar')
      expect(progressBars.length).toBeGreaterThan(0)
    })
  })

  it('shows empty state when no series exist', async () => {
    server.use(http.get('*/installments/series', () => HttpResponse.json([])))
    renderWithProviders(<InstallmentsPage />)
    await waitFor(() => expect(screen.getByText(/no installment series found/i)).toBeTruthy())
  })

  it('shows empty state with create CTA', async () => {
    server.use(http.get('*/installments/series', () => HttpResponse.json([])))
    renderWithProviders(<InstallmentsPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /create your first series/i })).toBeTruthy(),
    )
  })

  it('shows error state when API fails', async () => {
    server.use(
      http.get('*/installments/series', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    renderWithProviders(<InstallmentsPage />)
    await waitFor(() => expect(screen.getByText(/failed to load installment series/i)).toBeTruthy())
  })

  it('error state has retry button', async () => {
    server.use(
      http.get('*/installments/series', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    renderWithProviders(<InstallmentsPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy())
  })

  it('New Series button opens create dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InstallmentsPage />)
    await waitFor(() => screen.getByRole('button', { name: /new series/i }))
    await user.click(screen.getByRole('button', { name: /new series/i }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(screen.getByRole('heading', { name: /create installment series/i })).toBeTruthy()
  })

  it('create series form → submit → series appears in list', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InstallmentsPage />)

    await waitFor(() => screen.getByRole('button', { name: /new series/i }))
    await user.click(screen.getByRole('button', { name: /new series/i }))
    await waitFor(() => screen.getByRole('dialog'))

    await user.clear(screen.getByRole('textbox', { name: /description/i }))
    await user.type(screen.getByRole('textbox', { name: /description/i }), 'New TV')

    await user.clear(screen.getByRole('textbox', { name: /total amount/i }))
    await user.type(screen.getByRole('textbox', { name: /total amount/i }), '2400.00')

    const countInput = screen.getByRole('spinbutton', { name: /number of installments/i })
    await user.clear(countInput)
    await user.type(countInput, '6')

    await waitFor(() => {
      const select = screen.getByRole('combobox', { name: /^account$/i })
      expect(select.querySelectorAll('option').length).toBeGreaterThan(1)
    })
    const accountSelect = screen.getByRole('combobox', { name: /^account$/i })
    await user.selectOptions(accountSelect, 'account-1')

    await user.click(screen.getByRole('button', { name: /create series/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(screen.getByText('New TV')).toBeTruthy())
  })

  it('create series form shows validation error for empty description', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InstallmentsPage />)

    await waitFor(() => screen.getByRole('button', { name: /new series/i }))
    await user.click(screen.getByRole('button', { name: /new series/i }))
    await waitFor(() => screen.getByRole('dialog'))

    const descInput = screen.getByRole('textbox', { name: /description/i })
    await user.clear(descInput)

    await user.click(screen.getByRole('button', { name: /create series/i }))

    await waitFor(() => expect(screen.getByText(/description is required/i)).toBeTruthy())
  })

  it('create series form shows validation error for installment count < 2', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InstallmentsPage />)

    await waitFor(() => screen.getByRole('button', { name: /new series/i }))
    await user.click(screen.getByRole('button', { name: /new series/i }))
    await waitFor(() => screen.getByRole('dialog'))

    await user.clear(screen.getByRole('textbox', { name: /description/i }))
    await user.type(screen.getByRole('textbox', { name: /description/i }), 'Test')

    const countInput = screen.getByRole('spinbutton', { name: /number of installments/i })
    await user.clear(countInput)
    await user.type(countInput, '1')

    await user.click(screen.getByRole('button', { name: /create series/i }))

    await waitFor(() => expect(screen.getByText(/at least 2/i)).toBeTruthy())
  })

  it('Edit Series button opens edit dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InstallmentsPage />)

    await waitFor(() => screen.getByText(MOCK_SERIES_1.description))

    const editButtons = screen.getAllByRole('button', { name: /edit series/i })
    await user.click(editButtons[0])

    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(screen.getByRole('heading', { name: /edit series/i })).toBeTruthy()
  })

  it('Edit Installment button opens edit installment dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InstallmentsPage />)

    await waitFor(() => screen.getByText(MOCK_SERIES_1.description))

    const editInstButtons = screen.getAllByRole('button', { name: /edit installment/i })
    await user.click(editInstButtons[0])

    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(screen.getByRole('heading', { name: /edit individual installment/i })).toBeTruthy()
  })

  it('edit installment dialog shows individual override badge', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InstallmentsPage />)

    await waitFor(() => screen.getByText(MOCK_SERIES_1.description))

    const editInstButtons = screen.getAllByRole('button', { name: /edit installment/i })
    await user.click(editInstButtons[0])

    await waitFor(() => screen.getByRole('dialog'))
    expect(screen.getByText(/individual override/i)).toBeTruthy()
  })

  it('Settle Early button opens settle dialog with remaining info', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InstallmentsPage />)

    await waitFor(() => screen.getByText(MOCK_SERIES_1.description))

    const settleButtons = screen.getAllByRole('button', { name: /settle early/i })
    await user.click(settleButtons[0])

    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(screen.getByRole('heading', { name: /settle series early/i })).toBeTruthy()
    expect(screen.getAllByText(/remaining installments/i).length).toBeGreaterThan(0)
    expect(screen.getByText(MOCK_SERIES_1.remainingAmount)).toBeTruthy()
  })

  it('settle → series status updates in the list', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InstallmentsPage />)

    await waitFor(() => screen.getByText(MOCK_SERIES_1.description))

    const settleButtons = screen.getAllByRole('button', { name: /settle early/i })
    await user.click(settleButtons[0])
    await waitFor(() => screen.getByRole('dialog'))

    await user.click(screen.getByRole('button', { name: /settle early/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(screen.getAllByText('Settled').length).toBeGreaterThan(0))
  })

  it('Advance button opens advance dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InstallmentsPage />)

    await waitFor(() => screen.getByText(MOCK_SERIES_1.description))

    const advanceButtons = screen.getAllByRole('button', { name: /^advance/i })
    await user.click(advanceButtons[0])

    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(screen.getByRole('heading', { name: /advance installments/i })).toBeTruthy()
  })

  it('New Series button meets 44px min height', async () => {
    renderWithProviders(<InstallmentsPage />)
    await waitFor(() => screen.getByRole('button', { name: /new series/i }))
    const btn = screen.getByRole('button', { name: /new series/i })
    expect(btn.className).toContain('min-h-[44px]')
  })

  it('series with ACTIVE status shows action buttons', async () => {
    renderWithProviders(<InstallmentsPage />)
    await waitFor(() => screen.getByText(MOCK_SERIES_1.description))
    expect(screen.getAllByRole('button', { name: /edit series/i }).length).toBeGreaterThan(0)
  })
})
