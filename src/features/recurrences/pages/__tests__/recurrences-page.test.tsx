import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import {
  MOCK_RECURRENCE_1,
  MOCK_RECURRENCE_2,
  resetRecurrencesStore,
} from '@/test/handlers/recurrences.handlers'
import RecurrencesPage from '../recurrences-page'

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
  resetRecurrencesStore()
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('RecurrencesPage', () => {
  it('renders the page heading', async () => {
    renderWithProviders(<RecurrencesPage />)
    await waitFor(() => expect(screen.getByRole('heading', { name: /recurrences/i })).toBeTruthy())
  })

  it('shows a loading skeleton while fetching', () => {
    renderWithProviders(<RecurrencesPage />)
    expect(screen.getByLabelText('Loading recurrences')).toBeTruthy()
  })

  it('renders the list of recurrence rules after loading', async () => {
    renderWithProviders(<RecurrencesPage />)
    await waitFor(() => {
      expect(screen.getByText(MOCK_RECURRENCE_1.description)).toBeTruthy()
      expect(screen.getByText(MOCK_RECURRENCE_2.description)).toBeTruthy()
    })
  })

  it('shows empty state when no recurrences exist', async () => {
    server.use(http.get('*/recurrences', () => HttpResponse.json([])))
    renderWithProviders(<RecurrencesPage />)
    await waitFor(() => expect(screen.getByText(/no recurrence rules found/i)).toBeTruthy())
  })

  it('shows empty state with create CTA', async () => {
    server.use(http.get('*/recurrences', () => HttpResponse.json([])))
    renderWithProviders(<RecurrencesPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /create your first rule/i })).toBeTruthy(),
    )
  })

  it('shows error state when API fails', async () => {
    server.use(
      http.get('*/recurrences', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    renderWithProviders(<RecurrencesPage />)
    await waitFor(() => expect(screen.getByText(/failed to load recurrence rules/i)).toBeTruthy())
  })

  it('error state has retry button', async () => {
    server.use(
      http.get('*/recurrences', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    renderWithProviders(<RecurrencesPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy())
  })

  it('New Rule button opens create dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RecurrencesPage />)
    await waitFor(() => screen.getByRole('button', { name: /new rule/i }))
    await user.click(screen.getByRole('button', { name: /new rule/i }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(screen.getByRole('heading', { name: /create recurrence rule/i })).toBeTruthy()
  })

  it('create recurrence form → submit → rule appears in list', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RecurrencesPage />)

    await waitFor(() => screen.getByRole('button', { name: /new rule/i }))
    await user.click(screen.getByRole('button', { name: /new rule/i }))
    await waitFor(() => screen.getByRole('dialog'))

    await user.clear(screen.getByRole('textbox', { name: /description/i }))
    await user.type(screen.getByRole('textbox', { name: /description/i }), 'Gym membership')

    await user.clear(screen.getByRole('textbox', { name: /amount/i }))
    await user.type(screen.getByRole('textbox', { name: /amount/i }), '99.90')

    const accountIdInput = screen.getByRole('textbox', { name: /account id/i })
    await user.clear(accountIdInput)
    await user.type(accountIdInput, 'account-1')

    const startDateInput = screen.getByLabelText(/start date/i)
    await user.clear(startDateInput)
    await user.type(startDateInput, '2026-01-01')

    await user.click(screen.getByRole('button', { name: /create rule/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(screen.getByText('Gym membership')).toBeTruthy())
  })

  it('create recurrence form shows validation error for empty description', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RecurrencesPage />)

    await waitFor(() => screen.getByRole('button', { name: /new rule/i }))
    await user.click(screen.getByRole('button', { name: /new rule/i }))
    await waitFor(() => screen.getByRole('dialog'))

    const descInput = screen.getByRole('textbox', { name: /description/i })
    await user.clear(descInput)

    await user.click(screen.getByRole('button', { name: /create rule/i }))

    await waitFor(() => expect(screen.getByText(/description is required/i)).toBeTruthy())
  })

  it('cancel button closes the create dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RecurrencesPage />)

    await waitFor(() => screen.getByRole('button', { name: /new rule/i }))
    await user.click(screen.getByRole('button', { name: /new rule/i }))
    await waitFor(() => screen.getByRole('dialog'))

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  describe('status badge', () => {
    it('renders active status badge for active rules', async () => {
      renderWithProviders(<RecurrencesPage />)
      await waitFor(() => screen.getByText(MOCK_RECURRENCE_1.description))
      expect(screen.getAllByText('Active').length).toBeGreaterThan(0)
    })

    it('renders paused status badge for paused rules', async () => {
      renderWithProviders(<RecurrencesPage />)
      await waitFor(() => screen.getByText(MOCK_RECURRENCE_2.description))
      expect(screen.getByText('Paused')).toBeTruthy()
    })
  })

  describe('pause / resume', () => {
    it('pause button triggers pause mutation for active rule', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RecurrencesPage />)

      await waitFor(() => screen.getByText(MOCK_RECURRENCE_1.description))

      const pauseButtons = screen.getAllByRole('button', { name: /^pause /i })
      await user.click(pauseButtons[0])

      await waitFor(() => {
        const activeBadges = screen.queryAllByText('Active')
        const pausedBadges = screen.queryAllByText('Paused')
        expect(pausedBadges.length).toBeGreaterThan(activeBadges.length)
      })
    })

    it('resume button triggers resume mutation for paused rule', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RecurrencesPage />)

      await waitFor(() => screen.getByText(MOCK_RECURRENCE_2.description))

      const resumeButton = screen.getByRole('button', { name: /^resume /i })
      await user.click(resumeButton)

      await waitFor(() => {
        const activeBadges = screen.queryAllByText('Active')
        expect(activeBadges.length).toBeGreaterThanOrEqual(2)
      })
    })
  })

  describe('delete recurrence', () => {
    it('delete button opens confirmation dialog', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RecurrencesPage />)

      await waitFor(() => screen.getByText(MOCK_RECURRENCE_1.description))

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])

      await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
      expect(screen.getByRole('heading', { name: /delete recurrence rule/i })).toBeTruthy()
    })

    it('delete dialog shows strategy selector with FUTURE_ONLY and ALL options', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RecurrencesPage />)

      await waitFor(() => screen.getByText(MOCK_RECURRENCE_1.description))

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])

      await waitFor(() => screen.getByRole('dialog'))

      expect(screen.getAllByText(/future only/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/all — delete all/i).length).toBeGreaterThan(0)
    })

    it('delete dialog explains the difference between strategies', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RecurrencesPage />)

      await waitFor(() => screen.getByText(MOCK_RECURRENCE_1.description))

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])

      await waitFor(() => screen.getByRole('dialog'))

      expect(screen.getByText(/transactions already recorded are kept/i)).toBeTruthy()
      expect(screen.getByText(/past and future/i)).toBeTruthy()
    })

    it('confirming delete removes the rule from the list', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RecurrencesPage />)

      await waitFor(() => screen.getByText(MOCK_RECURRENCE_1.description))

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await user.click(deleteButtons[0])

      await waitFor(() => screen.getByRole('dialog'))
      await user.click(screen.getByRole('button', { name: /delete rule/i }))

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      await waitFor(() => expect(screen.queryByText(MOCK_RECURRENCE_1.description)).toBeNull())
    })
  })

  describe('New Rule button accessibility', () => {
    it('New Rule button meets 44px min height', async () => {
      renderWithProviders(<RecurrencesPage />)
      await waitFor(() => screen.getByRole('button', { name: /new rule/i }))
      const btn = screen.getByRole('button', { name: /new rule/i })
      expect(btn.className).toContain('min-h-[44px]')
    })
  })
})
