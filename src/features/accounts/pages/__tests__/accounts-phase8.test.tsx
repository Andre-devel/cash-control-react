import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { resetAccountsStore } from '@/test/handlers/accounts.handlers'
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

describe('Phase 8.1 — 409 conflict shows inline form error', () => {
  it('409 with fieldErrors shows the server message on the name field — no toast', async () => {
    server.use(
      http.post('*/accounts', () =>
        HttpResponse.json(
          {
            errorCode: 'CONFLICT',
            message: 'An account with this name already exists.',
            correlationId: 'test-corr',
            fieldErrors: { name: 'An account with this name already exists.' },
          },
          { status: 409 },
        ),
      ),
    )

    const { toast } = await import('@/lib/toast')
    const user = userEvent.setup()
    renderWithProviders(<AccountsPage />)

    await waitFor(() => screen.getByRole('button', { name: /nova conta/i }))
    await user.click(screen.getByRole('button', { name: /nova conta/i }))
    await waitFor(() => screen.getByRole('dialog'))

    const nameInput = screen.getByRole('textbox', { name: /name/i })
    await user.clear(nameInput)
    await user.type(nameInput, 'Nubank')

    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(screen.getByText(/an account with this name already exists/i)).toBeTruthy(),
    )

    expect(toast.error).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('409 without fieldErrors shows the server message as form root error — no toast', async () => {
    server.use(
      http.post('*/accounts', () =>
        HttpResponse.json(
          {
            errorCode: 'CONFLICT',
            message: 'An account with this name already exists.',
            correlationId: 'test-corr',
          },
          { status: 409 },
        ),
      ),
    )

    const { toast } = await import('@/lib/toast')
    const user = userEvent.setup()
    renderWithProviders(<AccountsPage />)

    await waitFor(() => screen.getByRole('button', { name: /nova conta/i }))
    await user.click(screen.getByRole('button', { name: /nova conta/i }))
    await waitFor(() => screen.getByRole('dialog'))

    const nameInput = screen.getByRole('textbox', { name: /name/i })
    await user.clear(nameInput)
    await user.type(nameInput, 'Nubank')

    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())

    expect(screen.getByRole('alert').textContent).toMatch(
      /an account with this name already exists/i,
    )
    expect(toast.error).not.toHaveBeenCalled()
  })
})

describe('Phase 8.2 — 5xx shows correlationId in toast', () => {
  it('500 error shows error toast with Ref correlationId', async () => {
    server.use(
      http.post('*/accounts', () =>
        HttpResponse.json(
          {
            errorCode: 'SERVER_ERROR',
            message: 'Internal server error.',
            correlationId: 'server-corr-abc',
          },
          { status: 500 },
        ),
      ),
    )

    const { toast } = await import('@/lib/toast')
    const user = userEvent.setup()
    renderWithProviders(<AccountsPage />)

    await waitFor(() => screen.getByRole('button', { name: /nova conta/i }))
    await user.click(screen.getByRole('button', { name: /nova conta/i }))
    await waitFor(() => screen.getByRole('dialog'))

    const nameInput = screen.getByRole('textbox', { name: /name/i })
    await user.clear(nameInput)
    await user.type(nameInput, 'My Account')

    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(toast.error).toHaveBeenCalledWith('Internal server error.', 'server-corr-abc')
  })

  it('4xx non-409 error shows error toast without correlationId', async () => {
    server.use(
      http.post('*/accounts', () =>
        HttpResponse.json(
          {
            errorCode: 'BAD_REQUEST',
            message: 'Invalid request data.',
            correlationId: 'client-corr-xyz',
          },
          { status: 400 },
        ),
      ),
    )

    const { toast } = await import('@/lib/toast')
    const user = userEvent.setup()
    renderWithProviders(<AccountsPage />)

    await waitFor(() => screen.getByRole('button', { name: /nova conta/i }))
    await user.click(screen.getByRole('button', { name: /nova conta/i }))
    await waitFor(() => screen.getByRole('dialog'))

    const nameInput = screen.getByRole('textbox', { name: /name/i })
    await user.clear(nameInput)
    await user.type(nameInput, 'My Account')

    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(toast.error).toHaveBeenCalledWith('Invalid request data.', undefined)
  })
})
