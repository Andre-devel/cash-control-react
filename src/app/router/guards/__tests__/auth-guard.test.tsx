import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthGuard } from '../auth-guard'
import { routeConfig } from '@/app/router/router'
import { useAuthStore } from '@/features/auth/store/auth.store'

vi.mock('@/styles/theme/dark-mode', () => ({
  applyTheme: vi.fn(),
  resolveTheme: vi.fn((t: string) => (t === 'dark' ? 'dark' : 'light')),
}))

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

beforeEach(() => {
  localStorage.clear()
  useAuthStore.getState().clearSession()
})

afterEach(() => {
  cleanup()
})

function renderGuarded(initialRoute: string) {
  const router = createMemoryRouter(
    [
      {
        element: <AuthGuard />,
        children: [
          {
            path: '/protected',
            element: (
              <div>
                <h1>Protected Content</h1>
              </div>
            ),
          },
        ],
      },
      {
        path: '/login',
        element: (
          <div>
            <h1>Login</h1>
          </div>
        ),
      },
    ],
    { initialEntries: [initialRoute] },
  )
  return { router, ...render(<RouterProvider router={router} />) }
}

describe('AuthGuard', () => {
  it('redirects to /login when not authenticated', async () => {
    renderGuarded('/protected')
    expect(await screen.findByRole('heading', { name: /login/i })).toBeTruthy()
  })

  it('renders children when authenticated', async () => {
    useAuthStore.getState().setToken('test-token')
    renderGuarded('/protected')
    expect(await screen.findByRole('heading', { name: /protected content/i })).toBeTruthy()
  })

  it('appends ?redirect param with the original path when redirecting', async () => {
    const { router } = renderGuarded('/protected')
    await screen.findByRole('heading', { name: /login/i })
    expect(router.state.location.search).toBe('?redirect=%2Fprotected')
  })

  it('preserves full redirect path including search params', async () => {
    const { router } = renderGuarded('/protected?foo=bar')
    await screen.findByRole('heading', { name: /login/i })
    expect(router.state.location.search).toContain('redirect=')
    expect(decodeURIComponent(router.state.location.search)).toContain('/protected?foo=bar')
  })

  it('redirects to the originally requested path after successful login', async () => {
    const user = userEvent.setup()

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    const router = createMemoryRouter(routeConfig, { initialEntries: ['/dashboard'] })

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )

    expect(
      await screen.findByRole('heading', { name: /bem-vindo de volta/i }, { timeout: 10000 }),
    ).toBeTruthy()

    await user.type(screen.getByLabelText(/e-mail/i), 'user@example.com')
    await user.type(screen.getByLabelText(/^senha/i), 'password123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { name: /olá/i }, { timeout: 10000 })).toBeTruthy()
  }, 30000)
})
