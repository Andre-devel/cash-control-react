import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { AuthProvider } from '../auth-provider'
import { useAuthStore } from '@/features/auth/store/auth.store'

vi.mock('@/styles/theme/dark-mode', () => ({
  applyTheme: vi.fn(),
  resolveTheme: vi.fn((t: string) => (t === 'dark' ? 'dark' : 'light')),
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

vi.mock('@/features/auth/api/auth.api', async () => {
  const original = await vi.importActual('@/features/auth/api/auth.api')
  return {
    ...(original as object),
    getMeApi: vi.fn().mockResolvedValue({
      id: 'user-123',
      email: 'user@example.com',
      displayName: 'Test User',
      status: 'ACTIVE',
      roles: ['USER'],
      permissions: [],
      linkedProviders: [],
      createdAt: '2026-01-01T00:00:00Z',
    }),
  }
})

function makeExpiredToken(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64')
  const payload = Buffer.from(JSON.stringify({ sub: 'u1', exp: 1, iat: 1 })).toString('base64')
  return `${header}.${payload}.sig`
}

function makeValidToken(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64')
  const payload = Buffer.from(JSON.stringify({ sub: 'u1', exp: 9_999_999_999, iat: 1 })).toString(
    'base64',
  )
  return `${header}.${payload}.sig`
}

function renderAuthProvider(initialRoute = '/protected') {
  const router = createMemoryRouter(
    [
      {
        element: <AuthProvider />,
        children: [
          {
            path: '/protected',
            element: (
              <div>
                <h1>Protected</h1>
              </div>
            ),
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
      },
    ],
    { initialEntries: [initialRoute] },
  )
  return render(<RouterProvider router={router} />)
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.getState().clearSession()
})

afterEach(() => {
  cleanup()
})

describe('AuthProvider', () => {
  it('renders children when no token is stored', async () => {
    renderAuthProvider()
    expect(await screen.findByRole('heading', { name: /protected/i })).toBeTruthy()
  })

  it('renders children when a valid non-expired token is stored', async () => {
    useAuthStore.getState().setToken(makeValidToken())
    renderAuthProvider()
    expect(await screen.findByRole('heading', { name: /protected/i })).toBeTruthy()
  })

  it('clears the session and redirects to /login when token is expired', async () => {
    useAuthStore.getState().setToken(makeExpiredToken())
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    renderAuthProvider()

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().token).toBeNull()
    })

    expect(await screen.findByRole('heading', { name: /login/i })).toBeTruthy()
  })

  it('completes initialization before rendering children', async () => {
    renderAuthProvider()
    expect(await screen.findByRole('heading', { name: /protected/i })).toBeTruthy()
  })

  it('populates user from getMeApi when valid token is present', async () => {
    useAuthStore.getState().setToken(makeValidToken())
    renderAuthProvider()

    await waitFor(() => {
      const user = useAuthStore.getState().user
      expect(user?.email).toBe('user@example.com')
      expect(user?.name).toBe('Test User')
      expect(user?.roles).toEqual(['USER'])
    })
  })
})
