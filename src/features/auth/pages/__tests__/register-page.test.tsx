import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { useAuthStore } from '@/features/auth/store/auth.store'
import RegisterPage from '../register-page'

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

const validForm = {
  name: 'Test User',
  email: 'newuser@example.com',
  password: 'password123',
  confirmPassword: 'password123',
}

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  overrides: Partial<typeof validForm> = {},
) {
  const data = { ...validForm, ...overrides }
  await user.type(screen.getByLabelText('Name'), data.name)
  await user.type(screen.getByLabelText('Email'), data.email)
  await user.type(screen.getByLabelText('Password'), data.password)
  await user.type(screen.getByLabelText('Confirm password'), data.confirmPassword)
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.getState().clearSession()
})

afterEach(() => {
  cleanup()
})

describe('RegisterPage', () => {
  it('renders the create account heading', async () => {
    renderWithProviders(<RegisterPage />)
    expect(await screen.findByRole('heading', { name: /create account/i })).toBeTruthy()
  })

  it('catches password mismatch at schema level before API call', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await fillForm(user, { confirmPassword: 'different' })
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('Passwords do not match')).toBeTruthy()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('shows inline error for email already in use', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await fillForm(user, { email: 'existing@example.com' })
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('This email address is already registered')).toBeTruthy()
  })

  it('shows success toast and navigates to login on successful registration', async () => {
    const { toast } = await import('@/lib/toast')
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Account created! Please sign in.')
    })

    expect(await screen.findByRole('heading', { name: /login/i })).toBeTruthy()
  })

  it('submit button is present and submittable before request starts', async () => {
    renderWithProviders(<RegisterPage />)

    const button = await screen.findByRole('button', { name: /create account/i })
    expect(button).toBeTruthy()
    expect((button as HTMLButtonElement).disabled).toBe(false)
  })

  it('disables submit button and shows loading text while request is in flight', async () => {
    server.use(
      http.post('*/auth/register', async () => {
        await delay(300)
        return HttpResponse.json({}, { status: 201 })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled()
      expect(screen.getByText(/creating account/i)).toBeTruthy()
    })
  })

  it('shows generic error toast on unexpected API error', async () => {
    const { toast } = await import('@/lib/toast')
    server.use(
      http.post('*/auth/register', () =>
        HttpResponse.json(
          {
            errorCode: 'INTERNAL_SERVER_ERROR',
            message: 'Something went wrong.',
            correlationId: 'test-id',
          },
          { status: 500 },
        ),
      ),
    )

    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Registration failed. Please try again.')
    })
  })

  it('auto-logs in and redirects to dashboard when API returns a token', async () => {
    const mockToken =
      'eyJhbGciOiJIUzI1NiJ9.' +
      Buffer.from(
        JSON.stringify({
          sub: 'u1',
          email: 'newuser@example.com',
          name: 'Test User',
          roles: [],
          exp: 9_999_999_999,
        }),
      ).toString('base64') +
      '.sig'

    server.use(
      http.post('*/auth/register', () => HttpResponse.json({ token: mockToken }, { status: 201 })),
    )

    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeTruthy()
  })
})

describe('RegisterPage — accessibility', () => {
  it('each form input has an accessible label', async () => {
    renderWithProviders(<RegisterPage />)
    await screen.findByRole('heading', { name: /create account/i })
    expect(screen.getByLabelText('Name')).toBeTruthy()
    expect(screen.getByLabelText('Email')).toBeTruthy()
    expect(screen.getByLabelText('Password')).toBeTruthy()
    expect(screen.getByLabelText('Confirm password')).toBeTruthy()
  })

  it('all form controls are reachable via Tab in the correct order', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)
    await screen.findByRole('heading', { name: /create account/i })

    await user.tab()
    expect(screen.getByLabelText('Name')).toHaveFocus()

    await user.tab()
    expect(screen.getByLabelText('Email')).toHaveFocus()

    await user.tab()
    expect(screen.getByLabelText('Password')).toHaveFocus()

    await user.tab()
    expect(screen.getByLabelText('Confirm password')).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('button', { name: /create account/i })).toHaveFocus()
  })

  it('form can be submitted by pressing Enter in the last field', async () => {
    const { toast } = await import('@/lib/toast')
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await user.type(screen.getByLabelText('Name'), 'Test User')
    await user.type(screen.getByLabelText('Email'), 'newuser@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm password'), 'password123{Enter}')

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Account created! Please sign in.')
    })
  })

  it('submit button has aria-busy="true" while the request is in flight', async () => {
    server.use(
      http.post('*/auth/register', async () => {
        await delay(300)
        return HttpResponse.json({}, { status: 201 })
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
    })
  })

  it('submit button uses the lg size variant (h-11 = 44px touch target)', async () => {
    renderWithProviders(<RegisterPage />)
    await screen.findByRole('heading', { name: /create account/i })
    const button = screen.getByRole('button', { name: /create account/i })
    expect(button.className).toContain('h-11')
  })
})
