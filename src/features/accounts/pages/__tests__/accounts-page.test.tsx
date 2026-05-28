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
    await waitFor(() => expect(screen.getByRole('heading', { name: /contas/i })).toBeTruthy())
  })

  it('shows a loading skeleton while fetching', () => {
    renderWithProviders(<AccountsPage />)
    expect(screen.getByLabelText('Carregando contas')).toBeTruthy()
  })

  it('renders the list of accounts after loading', async () => {
    renderWithProviders(<AccountsPage />)
    await waitFor(() => {
      expect(screen.getByText(MOCK_ACCOUNT_1.name)).toBeTruthy()
      expect(screen.getAllByText(MOCK_ACCOUNT_2.name).length).toBeGreaterThan(0)
    })
  })

  it('shows the "Adicionar conta" placeholder when no accounts exist', async () => {
    server.use(http.get('*/accounts', () => HttpResponse.json([])))
    renderWithProviders(<AccountsPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /adicionar conta/i })).toBeTruthy(),
    )
  })

  it('shows error state when API fails', async () => {
    server.use(
      http.get('*/accounts', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    renderWithProviders(<AccountsPage />)
    await waitFor(() => expect(screen.getByText(/erro ao carregar contas/i)).toBeTruthy())
  })

  it('error state has retry button', async () => {
    server.use(
      http.get('*/accounts', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    renderWithProviders(<AccountsPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeTruthy(),
    )
  })

  it('"Nova conta" button opens create dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AccountsPage />)
    await waitFor(() => screen.getByRole('button', { name: /nova conta/i }))
    await user.click(screen.getByRole('button', { name: /nova conta/i }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(screen.getByRole('heading', { name: /create account/i })).toBeTruthy()
  })

  it('create account form → submit → account appears in list', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AccountsPage />)

    await waitFor(() => screen.getByRole('button', { name: /nova conta/i }))
    await user.click(screen.getByRole('button', { name: /nova conta/i }))
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

    await waitFor(() => screen.getByRole('button', { name: /nova conta/i }))
    await user.click(screen.getByRole('button', { name: /nova conta/i }))
    await waitFor(() => screen.getByRole('dialog'))

    const nameInput = screen.getByRole('textbox', { name: /name/i })
    await user.clear(nameInput)

    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(screen.getByText(/name is required/i)).toBeTruthy())
  })

  it('cancel button closes the create dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AccountsPage />)

    await waitFor(() => screen.getByRole('button', { name: /nova conta/i }))
    await user.click(screen.getByRole('button', { name: /nova conta/i }))
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

    it('"Mostrar arquivadas" toggle reveals archived accounts', async () => {
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
      await user.click(screen.getByRole('button', { name: /mostrar arquivadas/i }))
      await waitFor(() => expect(screen.getByText(MOCK_ARCHIVED_ACCOUNT.name)).toBeTruthy())
    })

    it('archive account → disappears from default view', async () => {
      const user = userEvent.setup()
      renderWithProviders(<AccountsPage />)

      await waitFor(() => expect(screen.getByText(MOCK_ACCOUNT_1.name)).toBeTruthy())

      const moreButtons = screen.getAllByRole('button', { name: /mais opções para/i })
      await user.click(moreButtons[0])

      await waitFor(() => screen.getByRole('button', { name: /^arquivar$/i }))
      await user.click(screen.getByRole('button', { name: /^arquivar$/i }))

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

      const moreButtons = screen.getAllByRole('button', { name: /mais opções para/i })
      await user.click(moreButtons[0])

      await waitFor(() => screen.getByRole('button', { name: /^excluir$/i }))
      await user.click(screen.getByRole('button', { name: /^excluir$/i }))

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

      const moreButtons = screen.getAllByRole('button', { name: /mais opções para/i })
      await user.click(moreButtons[0])

      await waitFor(() => screen.getByRole('button', { name: /^excluir$/i }))
      await user.click(screen.getByRole('button', { name: /^excluir$/i }))

      await waitFor(() => screen.getByRole('dialog'))

      await user.click(screen.getByRole('button', { name: /delete account/i }))

      await waitFor(() => expect(screen.getByText(/archive it instead/i)).toBeTruthy())
    })
  })

  describe('distribution and transfers sections', () => {
    it('renders the distribution card', async () => {
      renderWithProviders(<AccountsPage />)
      await waitFor(() => expect(screen.getByText(/distribuição por tipo/i)).toBeTruthy())
    })

    it('renders the recent transfers card', async () => {
      renderWithProviders(<AccountsPage />)
      await waitFor(() => expect(screen.getByText(/transferências recentes/i)).toBeTruthy())
    })

    it('renders a transfer entry from the API', async () => {
      renderWithProviders(<AccountsPage />)
      await waitFor(() => expect(screen.getByText(/Nubank.*Savings/)).toBeTruthy())
    })
  })

  it('"Transferir" button opens transfer dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AccountsPage />)
    await waitFor(() => screen.getByRole('button', { name: /^transferir$/i }))
    await user.click(screen.getByRole('button', { name: /^transferir$/i }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
  })
})
