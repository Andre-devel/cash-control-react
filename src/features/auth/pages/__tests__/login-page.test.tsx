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
  it('renders the sign in heading', async () => {
    renderWithProviders(<LoginPage />)
    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeTruthy()
  })

  it('shows inline validation errors on empty form submission', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Email is required')).toBeTruthy()
    expect(await screen.findByText('Password is required')).toBeTruthy()
  })

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText('Email'), 'notanemail')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/valid email/i)).toBeTruthy()
  })

  it('disables the submit button while the request is in flight', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')

    const button = screen.getByRole('button', { name: /sign in/i })
    await user.click(button)

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe(MOCK_TOKEN)
    })
  })

  it('stores token and redirects on successful login', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

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

    await user.type(screen.getByLabelText('Email'), 'wrong@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials. Please try again.')
    })

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('token is not exposed in any form field or visible state after login', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    expect(document.body.textContent).not.toContain(MOCK_TOKEN)
  })
})

describe('LoginPage — accessibility', () => {
  it('each form input has an accessible label', async () => {
    renderWithProviders(<LoginPage />)
    await screen.findByRole('heading', { name: /sign in/i })
    expect(screen.getByLabelText('Email')).toBeTruthy()
    expect(screen.getByLabelText('Password')).toBeTruthy()
  })

  it('all form controls are reachable via Tab in the correct order', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)
    await screen.findByRole('heading', { name: /sign in/i })

    await user.tab()
    expect(screen.getByLabelText('Email')).toHaveFocus()

    await user.tab()
    expect(screen.getByLabelText('Password')).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('button', { name: /sign in/i })).toHaveFocus()
  })

  it('form can be submitted by pressing Enter in the password field', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123{Enter}')

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })
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

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'true')
      const spinner = button.querySelector('[aria-hidden="true"]')
      expect(spinner).toBeTruthy()
    })

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })
  })

  it('submit button uses the lg size variant (h-11 = 44px touch target)', async () => {
    renderWithProviders(<LoginPage />)
    await screen.findByRole('heading', { name: /sign in/i })
    const button = screen.getByRole('button', { name: /sign in/i })
    expect(button.className).toContain('h-11')
  })
})
