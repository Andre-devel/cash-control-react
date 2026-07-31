import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { MOCK_PROFILE, MOCK_CONSENTS } from '@/test/msw/handlers'
import { renderWithProviders } from '@/test/utils'
import ProfilePage from '../profile-page'

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
})

describe('ProfilePage', () => {
  it('renders the page heading', async () => {
    renderWithProviders(<ProfilePage />)
    expect(screen.getByText('Perfil')).toBeInTheDocument()
  })

  it('shows a loading skeleton while fetching profile', () => {
    renderWithProviders(<ProfilePage />)
    expect(screen.getByLabelText('Carregando perfil')).toBeInTheDocument()
  })

  it('pre-populates the form with the current profile name after loading', async () => {
    renderWithProviders(<ProfilePage />)

    await waitFor(() => expect(screen.getByDisplayValue(MOCK_PROFILE.name)).toBeInTheDocument())
  })

  it('displays the user email in the profile card', async () => {
    renderWithProviders(<ProfilePage />)

    await waitFor(() => expect(screen.getByText(MOCK_PROFILE.email)).toBeInTheDocument())
  })

  it('shows a success toast after a successful update submission', async () => {
    const { toast } = await import('@/lib/toast')
    const user = userEvent.setup()
    renderWithProviders(<ProfilePage />)

    await waitFor(() => expect(screen.getByDisplayValue(MOCK_PROFILE.name)).toBeInTheDocument())

    const input = screen.getByRole('textbox', { name: /nome de exibição/i })
    await user.clear(input)
    await user.type(input, 'New Name')

    const submitButton = screen.getByRole('button', { name: /salvar alterações/i })
    await user.click(submitButton)

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Perfil atualizado com sucesso.'),
    )
  })

  it('shows inline validation error when name is cleared and form is submitted', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProfilePage />)

    await waitFor(() => expect(screen.getByDisplayValue(MOCK_PROFILE.name)).toBeInTheDocument())

    const input = screen.getByRole('textbox', { name: /nome de exibição/i })
    await user.clear(input)

    const submitButton = screen.getByRole('button', { name: /salvar alterações/i })
    await user.click(submitButton)

    await waitFor(() => expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument())
  })

  it('shows a retry button when the profile fails to load', async () => {
    server.use(
      http.get('*/users/me', () =>
        HttpResponse.json(
          { errorCode: 'SERVER_ERROR', message: 'Internal error.', correlationId: 'test-id' },
          { status: 500 },
        ),
      ),
    )

    renderWithProviders(<ProfilePage />)

    await waitFor(() => expect(screen.getByText('Falha ao carregar perfil.')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument()
  })

  it('renders consent history after loading', async () => {
    renderWithProviders(<ProfilePage />)

    await waitFor(() => expect(screen.getByText(MOCK_CONSENTS[0].type)).toBeInTheDocument())
    expect(screen.getByText(MOCK_CONSENTS[1].type)).toBeInTheDocument()
  })

  it('shows empty state in consent history when there are no records', async () => {
    server.use(http.get('*/users/me/consents', () => HttpResponse.json([])))

    renderWithProviders(<ProfilePage />)

    await waitFor(() =>
      expect(screen.getByText('Nenhum registro de consentimento encontrado.')).toBeInTheDocument(),
    )
  })
})
