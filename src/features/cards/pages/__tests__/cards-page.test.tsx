import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { MOCK_CARD_1, MOCK_CARD_2, resetCardsStore } from '@/test/handlers/cards.handlers'
import CardsPage from '../cards-page'

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
  resetCardsStore()
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('CardsPage', () => {
  it('renders the page heading', async () => {
    renderWithProviders(<CardsPage />)
    await waitFor(() => expect(screen.getByRole('heading', { name: /credit cards/i })).toBeTruthy())
  })

  it('shows a loading skeleton while fetching', () => {
    renderWithProviders(<CardsPage />)
    expect(screen.getByLabelText('Loading cards')).toBeTruthy()
  })

  it('renders the list of cards after loading', async () => {
    renderWithProviders(<CardsPage />)
    await waitFor(() => {
      expect(screen.getByText(MOCK_CARD_1.name)).toBeTruthy()
      expect(screen.getByText(MOCK_CARD_2.name)).toBeTruthy()
    })
  })

  it('shows empty state when no cards exist', async () => {
    server.use(http.get('*/cards', () => HttpResponse.json([])))
    renderWithProviders(<CardsPage />)
    await waitFor(() => expect(screen.getByText(/no credit cards found/i)).toBeTruthy())
  })

  it('shows empty state with create CTA', async () => {
    server.use(http.get('*/cards', () => HttpResponse.json([])))
    renderWithProviders(<CardsPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /add your first card/i })).toBeTruthy(),
    )
  })

  it('shows error state when API fails', async () => {
    server.use(
      http.get('*/cards', () => HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 })),
    )
    renderWithProviders(<CardsPage />)
    await waitFor(() => expect(screen.getByText(/failed to load credit cards/i)).toBeTruthy())
  })

  it('error state has retry button', async () => {
    server.use(
      http.get('*/cards', () => HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 })),
    )
    renderWithProviders(<CardsPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy())
  })

  it('New Card button opens create dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CardsPage />)
    await waitFor(() => screen.getByRole('button', { name: /new card/i }))
    await user.click(screen.getByRole('button', { name: /new card/i }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(screen.getByRole('heading', { name: /create credit card/i })).toBeTruthy()
  })

  it('create card form → submit → card appears in list', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CardsPage />)

    await waitFor(() => screen.getByRole('button', { name: /new card/i }))
    await user.click(screen.getByRole('button', { name: /new card/i }))
    await waitFor(() => screen.getByRole('dialog'))

    await user.clear(screen.getByRole('textbox', { name: /^name$/i }))
    await user.type(screen.getByRole('textbox', { name: /^name$/i }), 'My Test Card')

    const lastFourInput = screen.getByRole('textbox', { name: /last four digits/i })
    await user.clear(lastFourInput)
    await user.type(lastFourInput, '9999')

    await user.click(screen.getByRole('button', { name: /create card/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(screen.getByText('My Test Card')).toBeTruthy())
  })

  it('create card form shows validation error for empty name', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CardsPage />)

    await waitFor(() => screen.getByRole('button', { name: /new card/i }))
    await user.click(screen.getByRole('button', { name: /new card/i }))
    await waitFor(() => screen.getByRole('dialog'))

    const nameInput = screen.getByRole('textbox', { name: /^name$/i })
    await user.clear(nameInput)

    await user.click(screen.getByRole('button', { name: /create card/i }))

    await waitFor(() => expect(screen.getByText(/name is required/i)).toBeTruthy())
  })

  it('cancel button closes the create dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CardsPage />)

    await waitFor(() => screen.getByRole('button', { name: /new card/i }))
    await user.click(screen.getByRole('button', { name: /new card/i }))
    await waitFor(() => screen.getByRole('dialog'))

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  describe('archive card', () => {
    it('archive button opens confirmation dialog', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CardsPage />)

      await waitFor(() => screen.getByText(MOCK_CARD_1.name))

      const archiveButtons = screen.getAllByRole('button', { name: /archive/i })
      await user.click(archiveButtons[0])

      await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
      expect(screen.getByRole('heading', { name: /archive card/i })).toBeTruthy()
    })

    it('confirming archive removes card from active list', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CardsPage />)

      await waitFor(() => screen.getByText(MOCK_CARD_1.name))

      const archiveButtons = screen.getAllByRole('button', { name: /archive/i })
      await user.click(archiveButtons[0])

      await waitFor(() => screen.getByRole('dialog'))
      await user.click(screen.getByRole('button', { name: /archive card/i }))

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    })
  })

  describe('New Card button accessibility', () => {
    it('New Card button meets 44px min height', async () => {
      renderWithProviders(<CardsPage />)
      await waitFor(() => screen.getByRole('button', { name: /new card/i }))
      const btn = screen.getByRole('button', { name: /new card/i })
      expect(btn.className).toContain('min-h-[44px]')
    })
  })
})
