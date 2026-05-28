import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import VerifyEmailPage from '../verify-email-page'

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

describe('VerifyEmailPage — pending state', () => {
  it('shows "check your email" message when ?pending=true and no token', async () => {
    renderWithProviders(<VerifyEmailPage />, { initialRoute: '/test?pending=true' })
    expect(await screen.findByRole('heading', { name: /verifique seu e-mail/i })).toBeTruthy()
  })
})

describe('VerifyEmailPage — token verification', () => {
  it('shows success message after successful token verification', async () => {
    server.use(
      http.get('*/auth/email/verify', () =>
        HttpResponse.json({ message: 'Email verified successfully.' }),
      ),
    )

    renderWithProviders(<VerifyEmailPage />, { initialRoute: '/test?token=valid-token' })

    expect(await screen.findByRole('heading', { name: /e-mail verificado/i })).toBeTruthy()
    expect(screen.getByText(/verified successfully/i)).toBeTruthy()
  })

  it('shows resend form when token is expired', async () => {
    renderWithProviders(<VerifyEmailPage />, { initialRoute: '/test?token=expired-token' })

    expect(await screen.findByRole('heading', { name: /link inválido ou expirado/i })).toBeTruthy()
    expect(screen.getByLabelText(/e-mail/i)).toBeTruthy()
  })

  it('shows generic confirmation after resend submission', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VerifyEmailPage />, { initialRoute: '/test?token=expired-token' })

    await screen.findByRole('heading', { name: /link inválido ou expirado/i })

    await user.type(screen.getByLabelText(/e-mail/i), 'user@example.com')
    await user.click(screen.getByRole('button', { name: /reenviar link/i }))

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /reenviar link/i })).toBeNull()
    })
  })
})

describe('VerifyEmailPage — resend form only', () => {
  it('renders resend form when no token and not pending', async () => {
    renderWithProviders(<VerifyEmailPage />, { initialRoute: '/test' })
    expect(await screen.findByRole('heading', { name: /reenviar verificação/i })).toBeTruthy()
    expect(screen.getByLabelText(/e-mail/i)).toBeTruthy()
  })

  it('shows validation error on empty email submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VerifyEmailPage />, { initialRoute: '/test' })

    await screen.findByRole('heading', { name: /reenviar verificação/i })
    await user.click(screen.getByRole('button', { name: /reenviar link/i }))

    expect(await screen.findByText(/e-mail é obrigatório/i)).toBeTruthy()
  })
})
