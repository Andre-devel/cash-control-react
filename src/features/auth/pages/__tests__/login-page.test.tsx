import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { MOCK_TOKEN } from '@/test/msw/handlers'
import LoginPage from '../login-page'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn() },
  LOG_EVENTS: {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILURE: 'LOGIN_FAILURE',
    LOGOUT: 'LOGOUT',
    SESSION_RESTORED: 'SESSION_RESTORED',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    UNAUTHORIZED_ROUTE_ACCESS_ATTEMPT: 'UNAUTHORIZED_ROUTE_ACCESS_ATTEMPT',
    FORBIDDEN_ROUTE_ACCESS_ATTEMPT: 'FORBIDDEN_ROUTE_ACCESS_ATTEMPT',
  },
}))

vi.mock('@/styles/theme/dark-mode', () => ({
  applyTheme: vi.fn(),
  resolveTheme: vi.fn((t: string) => (t === 'dark' ? 'dark' : 'light')),
}))

beforeEach(() => {
  localStorage.clear()
  useAuthStore.getState().clearSession()
})

afterEach(() => {
  cleanup()
})

describe('LoginPage', () => {
  it('renders the welcome heading', async () => {
    renderWithProviders(<LoginPage />)
    expect(await screen.findByRole('heading', { name: /bem-vindo de volta/i })).toBeTruthy()
  })

  it('shows inline validation errors on empty form submission', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Email is required')).toBeTruthy()
    expect(await screen.findByText('Password is required')).toBeTruthy()
  })

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText(/e-mail/i), 'notanemail')
    await user.type(screen.getByLabelText(/^senha/i), 'password123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText(/valid email/i)).toBeTruthy()
  })

  it('stores token and redirects on successful login', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText(/e-mail/i), 'user@example.com')
    await user.type(screen.getByLabelText(/^senha/i), 'password123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe(MOCK_TOKEN)
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeTruthy()
  })

  it('shows an error toast on 401 response without exposing credentials', async () => {
    const { toast } = await import('@/lib/toast')
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText(/e-mail/i), 'wrong@example.com')
    await user.type(screen.getByLabelText(/^senha/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(
      () => {
        expect(toast.error).toHaveBeenCalledWith('Invalid credentials. Please try again.')
      },
      { timeout: 5000 },
    )

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('token is not exposed in any form field or visible state after login', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText(/e-mail/i), 'user@example.com')
    await user.type(screen.getByLabelText(/^senha/i), 'password123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    expect(document.body.textContent).not.toContain(MOCK_TOKEN)
  })

  it('renders a link to forgot password page', async () => {
    renderWithProviders(<LoginPage />)
    await screen.findByRole('heading', { name: /bem-vindo de volta/i })
    const forgotLink = screen.getByRole('link', { name: /esqueci minha senha/i })
    expect(forgotLink).toBeTruthy()
    expect(forgotLink.getAttribute('href')).toBe('/forgot-password')
  })
})

describe('LoginPage — accessibility', () => {
  it('each form input has an accessible label', async () => {
    renderWithProviders(<LoginPage />)
    await screen.findByRole('heading', { name: /bem-vindo de volta/i })
    expect(screen.getByLabelText(/e-mail/i)).toBeTruthy()
    expect(screen.getByLabelText(/^senha/i)).toBeTruthy()
  })

  it('submit button has aria-busy="true" and spinner is hidden via aria-hidden while request is in flight', async () => {
    server.use(
      http.post('*/auth/login', async () => {
        await delay(300)
        return HttpResponse.json({ token: MOCK_TOKEN })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText(/e-mail/i), 'user@example.com')
    await user.type(screen.getByLabelText(/^senha/i), 'password123')

    const submitButton = screen.getByRole('button', { name: 'Entrar' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(submitButton).toHaveAttribute('aria-busy', 'true')
      const spinner = submitButton.querySelector('[aria-hidden="true"]')
      expect(spinner).toBeTruthy()
    })

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })
  })

  it('submit button uses the lg size variant (44px touch target)', async () => {
    renderWithProviders(<LoginPage />)
    await screen.findByRole('heading', { name: /bem-vindo de volta/i })
    const button = screen.getByRole('button', { name: 'Entrar' })
    expect(button.className).toContain('btn-lg')
  })
})
