import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import ForgotPasswordPage from '../forgot-password-page'

vi.mock('@/styles/theme/dark-mode', () => ({
  applyTheme: vi.fn(),
  resolveTheme: vi.fn((t: string) => (t === 'dark' ? 'dark' : 'light')),
}))

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})

describe('ForgotPasswordPage', () => {
  it('renders the heading and email field', async () => {
    renderWithProviders(<ForgotPasswordPage />)
    expect(await screen.findByRole('heading', { name: /recuperar acesso/i })).toBeTruthy()
    expect(screen.getByLabelText(/e-mail/i)).toBeTruthy()
  })

  it('shows validation error on empty submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ForgotPasswordPage />)

    await screen.findByRole('heading', { name: /recuperar acesso/i })
    await user.click(screen.getByRole('button', { name: /enviar link/i }))

    expect(await screen.findByText(/e-mail é obrigatório/i)).toBeTruthy()
  })

  it('always shows success message after submission (anti-enumeration)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ForgotPasswordPage />)

    await screen.findByRole('heading', { name: /recuperar acesso/i })
    await user.type(screen.getByLabelText(/e-mail/i), 'anyemail@example.com')
    await user.click(screen.getByRole('button', { name: /enviar link/i }))

    await waitFor(() => {
      expect(screen.getByText(/se esse e-mail estiver cadastrado/i)).toBeTruthy()
    })
  })

  it('has a link back to login', async () => {
    renderWithProviders(<ForgotPasswordPage />)
    await screen.findByRole('heading', { name: /recuperar acesso/i })
    const loginLink = screen.getByRole('link', { name: /voltar para login/i })
    expect(loginLink).toBeTruthy()
  })
})
