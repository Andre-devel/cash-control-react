import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import {
  MOCK_SERIES_1,
  MOCK_SERIES_2,
  MOCK_TRANSACTIONS_SERIES_1,
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
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /parcelamentos/i })).toBeTruthy(),
    )
  })

  it('shows a loading skeleton while fetching', () => {
    renderWithProviders(<InstallmentsPage />)
    expect(screen.getByLabelText('Carregando parcelamentos')).toBeTruthy()
  })

  it('renders the list of installment series after loading', async () => {
    renderWithProviders(<InstallmentsPage />)
    await waitFor(() => {
      expect(screen.getByText(MOCK_SERIES_1.description)).toBeTruthy()
      expect(screen.getByText(MOCK_SERIES_2.description)).toBeTruthy()
    })
  })

  it('shows total installments count for each series', async () => {
    renderWithProviders(<InstallmentsPage />)
    await waitFor(() => {
      expect(screen.getByText(`${MOCK_SERIES_1.totalInstallments}x`)).toBeTruthy()
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
    await waitFor(() => expect(screen.getByText(/nenhuma série/i)).toBeTruthy())
  })

  it('shows empty state with create CTA', async () => {
    server.use(http.get('*/installments/series', () => HttpResponse.json([])))
    renderWithProviders(<InstallmentsPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /criar primeira série/i })).toBeTruthy(),
    )
  })

  it('shows error state when API fails', async () => {
    server.use(
      http.get('*/installments/series', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    renderWithProviders(<InstallmentsPage />)
    await waitFor(() => expect(screen.getByText(/falha ao carregar parcelamentos/i)).toBeTruthy())
  })

  it('error state has retry button', async () => {
    server.use(
      http.get('*/installments/series', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    renderWithProviders(<InstallmentsPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeTruthy(),
    )
  })

  it('Nova série button opens create dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InstallmentsPage />)
    await waitFor(() => screen.getByRole('button', { name: /nova série/i }))
    await user.click(screen.getByRole('button', { name: /nova série/i }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(screen.getByRole('heading', { name: /nova série de parcelamentos/i })).toBeTruthy()
  })

  it('create series form → submit → series appears in list', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InstallmentsPage />)

    await waitFor(() => screen.getByRole('button', { name: /nova série/i }))
    await user.click(screen.getByRole('button', { name: /nova série/i }))
    await waitFor(() => screen.getByRole('dialog'))

    await user.clear(screen.getByRole('textbox', { name: /descrição/i }))
    await user.type(screen.getByRole('textbox', { name: /descrição/i }), 'New TV')

    await user.clear(screen.getByRole('textbox', { name: /valor total/i }))
    await user.type(screen.getByRole('textbox', { name: /valor total/i }), '2400.00')

    const countInput = screen.getByRole('spinbutton', { name: /número de parcelas/i })
    await user.clear(countInput)
    await user.type(countInput, '6')

    await waitFor(() => {
      const select = screen.getByRole('combobox', { name: /^conta$/i })
      expect(select.querySelectorAll('option').length).toBeGreaterThan(1)
    })
    const accountSelect = screen.getByRole('combobox', { name: /^conta$/i })
    await user.selectOptions(accountSelect, 'account-1')

    await user.click(screen.getByRole('button', { name: /criar série/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(screen.getByText('New TV')).toBeTruthy())
  })

  it('create series form shows validation error for empty description', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InstallmentsPage />)

    await waitFor(() => screen.getByRole('button', { name: /nova série/i }))
    await user.click(screen.getByRole('button', { name: /nova série/i }))
    await waitFor(() => screen.getByRole('dialog'))

    const descInput = screen.getByRole('textbox', { name: /descrição/i })
    await user.clear(descInput)

    await user.click(screen.getByRole('button', { name: /criar série/i }))

    await waitFor(() => expect(screen.getByText(/descrição é obrigatória/i)).toBeTruthy())
  })

  it('create series form shows validation error for installment count < 2', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InstallmentsPage />)

    await waitFor(() => screen.getByRole('button', { name: /nova série/i }))
    await user.click(screen.getByRole('button', { name: /nova série/i }))
    await waitFor(() => screen.getByRole('dialog'))

    await user.clear(screen.getByRole('textbox', { name: /descrição/i }))
    await user.type(screen.getByRole('textbox', { name: /descrição/i }), 'Test')

    const countInput = screen.getByRole('spinbutton', { name: /número de parcelas/i })
    await user.clear(countInput)
    await user.type(countInput, '1')

    await user.click(screen.getByRole('button', { name: /criar série/i }))

    await waitFor(() => expect(screen.getByText(/pelo menos 2/i)).toBeTruthy())
  })

  it('Edit Series button opens edit dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InstallmentsPage />)

    await waitFor(() => screen.getByText(MOCK_SERIES_1.description))

    const editButtons = screen.getAllByRole('button', { name: /edit series/i })
    await user.click(editButtons[0])

    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(screen.getByRole('heading', { name: /editar série/i })).toBeTruthy()
  })

  it('Edit Installment button opens edit installment dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InstallmentsPage />)

    await waitFor(() => screen.getByText(MOCK_SERIES_1.description))

    const editInstButtons = screen.getAllByRole('button', { name: /edit installment/i })
    await user.click(editInstButtons[0])

    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(screen.getByRole('heading', { name: /editar parcela individual/i })).toBeTruthy()
  })

  it('edit installment dialog shows individual override badge', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InstallmentsPage />)

    await waitFor(() => screen.getByText(MOCK_SERIES_1.description))

    const editInstButtons = screen.getAllByRole('button', { name: /edit installment/i })
    await user.click(editInstButtons[0])

    await waitFor(() => screen.getByRole('dialog'))
    expect(screen.getByText(/substituição individual/i)).toBeTruthy()
  })

  it('Settle Early button opens settle dialog with remaining info', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InstallmentsPage />)

    await waitFor(() => screen.getByText(MOCK_SERIES_1.description))

    const settleButtons = screen.getAllByRole('button', { name: /settle early/i })
    await user.click(settleButtons[0])

    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(screen.getByRole('heading', { name: /liquidar série antecipadamente/i })).toBeTruthy()
    expect(screen.getAllByText(/total de parcelas/i).length).toBeGreaterThan(0)
    expect(screen.getByText(MOCK_SERIES_1.totalAmount)).toBeTruthy()
  })

  it('settle → series status updates in the list', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InstallmentsPage />)

    await waitFor(() => screen.getByText(MOCK_SERIES_1.description))

    const settleButtons = screen.getAllByRole('button', { name: /settle early/i })
    await user.click(settleButtons[0])
    await waitFor(() => screen.getByRole('dialog'))

    await user.click(screen.getByRole('button', { name: /liquidar antecipadamente/i }))

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
    expect(screen.getByRole('heading', { name: /antecipar parcelas/i })).toBeTruthy()
  })

  it('advance dialog loads pending installments as checkboxes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InstallmentsPage />)

    await waitFor(() => screen.getByText(MOCK_SERIES_1.description))

    const advanceButtons = screen.getAllByRole('button', { name: /^advance/i })
    await user.click(advanceButtons[0])

    await waitFor(() => screen.getByRole('dialog'))

    const pendingTransactions = MOCK_TRANSACTIONS_SERIES_1.filter((t) => t.status === 'PENDING')
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBe(pendingTransactions.length)
    })
  })

  it('advance dialog has new due date input', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InstallmentsPage />)

    await waitFor(() => screen.getByText(MOCK_SERIES_1.description))

    const advanceButtons = screen.getAllByRole('button', { name: /^advance/i })
    await user.click(advanceButtons[0])

    await waitFor(() => screen.getByRole('dialog'))

    await waitFor(() => expect(screen.getByLabelText(/nova data de vencimento/i)).toBeTruthy())
  })

  it('advance dialog submits with selected transactionIds and newDate', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InstallmentsPage />)

    await waitFor(() => screen.getByText(MOCK_SERIES_1.description))

    const advanceButtons = screen.getAllByRole('button', { name: /^advance/i })
    await user.click(advanceButtons[0])

    await waitFor(() => screen.getByRole('dialog'))

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBeGreaterThan(0)
    })

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])

    const dateInput = screen.getByLabelText(/nova data de vencimento/i)
    await user.type(dateInput, '2026-07-01')

    await user.click(screen.getByRole('button', { name: /antecipar parcelas/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('advance dialog shows validation error when no installments are selected', async () => {
    const user = userEvent.setup()
    renderWithProviders(<InstallmentsPage />)

    await waitFor(() => screen.getByText(MOCK_SERIES_1.description))

    const advanceButtons = screen.getAllByRole('button', { name: /^advance/i })
    await user.click(advanceButtons[0])

    await waitFor(() => screen.getByRole('dialog'))
    await waitFor(() => {
      expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0)
    })

    await user.click(screen.getByRole('button', { name: /antecipar parcelas/i }))

    await waitFor(() => expect(screen.getByText(/selecione pelo menos uma parcela/i)).toBeTruthy())
  })

  it('Nova série button uses primary design system style', async () => {
    renderWithProviders(<InstallmentsPage />)
    await waitFor(() => screen.getByRole('button', { name: /nova série/i }))
    const btn = screen.getByRole('button', { name: /nova série/i })
    expect(btn.className).toContain('btn-primary')
  })

  it('series with ACTIVE status shows action buttons', async () => {
    renderWithProviders(<InstallmentsPage />)
    await waitFor(() => screen.getByText(MOCK_SERIES_1.description))
    expect(screen.getAllByRole('button', { name: /edit series/i }).length).toBeGreaterThan(0)
  })
})
