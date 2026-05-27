import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { RoleGuard } from '../role-guard'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type { AuthUser } from '@/features/auth/types'

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

const ADMIN_USER: AuthUser = {
  id: '1',
  email: 'admin@example.com',
  name: 'Admin',
  roles: ['ADMIN'],
}
const REGULAR_USER: AuthUser = { id: '2', email: 'user@example.com', name: 'User', roles: ['USER'] }

function renderRoleGuarded(requiredRoles: string[], initialRoute: string) {
  const router = createMemoryRouter(
    [
      {
        element: <RoleGuard requiredRoles={requiredRoles} />,
        children: [
          {
            path: '/admin',
            element: (
              <div>
                <h1>Admin Panel</h1>
              </div>
            ),
          },
        ],
      },
      {
        path: '/dashboard',
        element: (
          <div>
            <h1>Dashboard</h1>
          </div>
        ),
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

describe('RoleGuard', () => {
  it('renders children when user has the required role', async () => {
    useAuthStore.getState().setUser(ADMIN_USER)
    renderRoleGuarded(['ADMIN'], '/admin')
    expect(await screen.findByRole('heading', { name: /admin panel/i })).toBeTruthy()
  })

  it('redirects to /dashboard when user lacks the required role', async () => {
    useAuthStore.getState().setUser(REGULAR_USER)
    renderRoleGuarded(['ADMIN'], '/admin')
    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeTruthy()
  })

  it('redirects to /dashboard when user has no roles', async () => {
    useAuthStore.getState().setUser({ id: '3', email: 'new@example.com', name: 'New', roles: [] })
    renderRoleGuarded(['ADMIN'], '/admin')
    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeTruthy()
  })

  it('redirects to /dashboard when no user is set', async () => {
    renderRoleGuarded(['ADMIN'], '/admin')
    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeTruthy()
  })

  it('allows access when user has one of multiple accepted roles', async () => {
    useAuthStore.getState().setUser(REGULAR_USER)
    renderRoleGuarded(['ADMIN', 'USER'], '/admin')
    expect(await screen.findByRole('heading', { name: /admin panel/i })).toBeTruthy()
  })
})
