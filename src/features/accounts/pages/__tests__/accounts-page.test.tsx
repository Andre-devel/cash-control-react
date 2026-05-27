import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import {
  MOCK_ACCOUNT_1,
  MOCK_ACCOUNT_2,
  MOCK_ARCHIVED_ACCOUNT,
  resetAccountsStore,
} from '@/test/handlers/accounts.handlers'
import AccountsPage from '../accounts-page'

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
  resetAccountsStore()
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('AccountsPage', () => {
  it('renders the page heading', async () => {
    renderWithProviders(<AccountsPage />)
    await waitFor(() => expect(screen.getByRole('heading', { name: /accounts/i })).toBeTruthy())
  })

  it('shows a loading skeleton while fetching', () => {
    renderWithProviders(<AccountsPage />)
    expect(screen.getByLabelText('Loading accounts')).toBeTruthy()
  })

  it('renders the list of accounts after loading', async () => {
    renderWithProviders(<AccountsPage />)
    await waitFor(() => {
      expect(screen.getByText(MOCK_ACCOUNT_1.name)).toBeTruthy()
      // MOCK_ACCOUNT_2 name is "Savings" which also matches the type label, use getAllByText
      expect(screen.getAllByText(MOCK_ACCOUNT_2.name).length).toBeGreaterThan(0)
    })
  })

  it('shows empty state when no accounts exist', async () => {
    server.use(http.get('*/accounts', () => HttpResponse.json([])))
    renderWithProviders(<AccountsPage />)
    await waitFor(() => expect(screen.getByText(/no accounts found/i)).toBeTruthy())
  })

  it('shows empty state with create CTA', async () => {
    server.use(http.get('*/accounts', () => HttpResponse.json([])))
    renderWithProviders(<AccountsPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /create your first account/i })).toBeTruthy(),
    )
  })

  it('shows error state when API fails', async () => {
    server.use(
      http.get('*/accounts', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    renderWithProviders(<AccountsPage />)
    await waitFor(() => expect(screen.getByText(/failed to load accounts/i)).toBeTruthy())
  })

  it('error state has retry button', async () => {
    server.use(
      http.get('*/accounts', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    renderWithProviders(<AccountsPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy())
  })

  it('New Account button opens create dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AccountsPage />)
    await waitFor(() => screen.getByRole('button', { name: /new account/i }))
    await user.click(screen.getByRole('button', { name: /new account/i }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(screen.getByRole('heading', { name: /create account/i })).toBeTruthy()
  })

  it('create account form → submit → account appears in list', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AccountsPage />)

    await waitFor(() => screen.getByRole('button', { name: /new account/i }))
    await user.click(screen.getByRole('button', { name: /new account/i }))
    await waitFor(() => screen.getByRole('dialog'))

    await user.clear(screen.getByRole('textbox', { name: /name/i }))
    await user.type(screen.getByRole('textbox', { name: /name/i }), 'My New Account')

    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(screen.getByText('My New Account')).toBeTruthy())
  })

  it('create account form shows validation error for empty name', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AccountsPage />)

    await waitFor(() => screen.getByRole('button', { name: /new account/i }))
    await user.click(screen.getByRole('button', { name: /new account/i }))
    await waitFor(() => screen.getByRole('dialog'))

    const nameInput = screen.getByRole('textbox', { name: /name/i })
    await user.clear(nameInput)

    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(screen.getByText(/name is required/i)).toBeTruthy())
  })

  it('cancel button closes the create dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AccountsPage />)

    await waitFor(() => screen.getByRole('button', { name: /new account/i }))
    await user.click(screen.getByRole('button', { name: /new account/i }))
    await waitFor(() => screen.getByRole('dialog'))

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  describe('archive / unarchive', () => {
    it('archived accounts are hidden from the default view', async () => {
      server.use(
        http.get('*/accounts', ({ request }) => {
          const url = new URL(request.url)
          const includeArchived = url.searchParams.get('includeArchived') === 'true'
          const accounts = includeArchived
            ? [MOCK_ACCOUNT_1, MOCK_ACCOUNT_2, MOCK_ARCHIVED_ACCOUNT]
            : [MOCK_ACCOUNT_1, MOCK_ACCOUNT_2]
          return HttpResponse.json(accounts)
        }),
      )
      renderWithProviders(<AccountsPage />)
      await waitFor(() => expect(screen.getByText(MOCK_ACCOUNT_1.name)).toBeTruthy())
      expect(screen.queryByText(MOCK_ARCHIVED_ACCOUNT.name)).toBeNull()
    })

    it('show archived toggle reveals archived accounts', async () => {
      server.use(
        http.get('*/accounts', ({ request }) => {
          const url = new URL(request.url)
          const includeArchived = url.searchParams.get('includeArchived') === 'true'
          const accounts = includeArchived
            ? [MOCK_ACCOUNT_1, MOCK_ACCOUNT_2, MOCK_ARCHIVED_ACCOUNT]
            : [MOCK_ACCOUNT_1, MOCK_ACCOUNT_2]
          return HttpResponse.json(accounts)
        }),
      )

      const user = userEvent.setup()
      renderWithProviders(<AccountsPage />)

      await waitFor(() => screen.getByText(MOCK_ACCOUNT_1.name))
      await user.click(screen.getByRole('button', { name: /show archived/i }))
      await waitFor(() => expect(screen.getByText(MOCK_ARCHIVED_ACCOUNT.name)).toBeTruthy())
    })

    it('archive account → disappears from default view', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AccountsPage />)

      await waitFor(() => expect(screen.getByText(MOCK_ACCOUNT_1.name)).toBeTruthy())

      // Exclude the "Show Archived" toggle — click only the card-level "Archive" button
      const archiveButtons = screen.getAllByRole('button', { name: /^archive$/i })
      await user.click(archiveButtons[0])

      await waitFor(() => screen.getByRole('dialog'))
      await user.click(screen.getByRole('button', { name: /archive account/i }))

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      await waitFor(() => expect(screen.queryByText(MOCK_ACCOUNT_1.name)).toBeNull())
    })
  })

  describe('delete account', () => {
    it('delete button opens confirmation dialog', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AccountsPage />)

      await waitFor(() => screen.getByText(MOCK_ACCOUNT_1.name))

      const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i })
      await user.click(deleteButtons[0])

      await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    })

    it('409 conflict shows explanatory error message', async () => {
      server.use(
        http.delete('*/accounts/:id', () =>
          HttpResponse.json(
            {
              errorCode: 'ACCOUNT_HAS_TRANSACTIONS',
              message: 'Account has linked transactions and cannot be deleted.',
              correlationId: 'test-id',
            },
            { status: 409 },
          ),
        ),
      )

      const user = userEvent.setup()
      renderWithProviders(<AccountsPage />)

      await waitFor(() => screen.getByText(MOCK_ACCOUNT_1.name))
      const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i })
      await user.click(deleteButtons[0])
      await waitFor(() => screen.getByRole('dialog'))

      await user.click(screen.getByRole('button', { name: /delete account/i }))

      await waitFor(() => expect(screen.getByText(/archive it instead/i)).toBeTruthy())
    })
  })

  describe('New Account button accessibility', () => {
    it('New Account button meets 44px min height', async () => {
      renderWithProviders(<AccountsPage />)
      await waitFor(() => screen.getByRole('button', { name: /new account/i }))
      const btn = screen.getByRole('button', { name: /new account/i })
      expect(btn.className).toContain('min-h-[44px]')
    })
  })
})
