import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { PermissionGuard } from '../permission-guard'
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

const USER_WITH_PERMISSIONS = (permissions: string[]): AuthUser => ({
  id: 'u1',
  email: 'admin@example.com',
  name: 'Admin',
  roles: ['ADMIN'],
  permissions,
})

function renderPermissionGuarded(
  requiredPermissions: string[],
  initialRoute: string,
  requireAll = false,
) {
  const router = createMemoryRouter(
    [
      {
        element: (
          <PermissionGuard requiredPermissions={requiredPermissions} requireAll={requireAll} />
        ),
        children: [
          {
            path: '/admin/roles',
            element: (
              <div>
                <h1>Roles Page</h1>
              </div>
            ),
          },
        ],
      },
      {
        path: '/forbidden',
        element: (
          <div>
            <h1>Forbidden</h1>
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

describe('PermissionGuard', () => {
  it('redirects to /forbidden when user has no permissions', async () => {
    useAuthStore.getState().setUser(USER_WITH_PERMISSIONS([]))
    renderPermissionGuarded(['role:create', 'role:update', 'role:delete'], '/admin/roles')
    expect(await screen.findByRole('heading', { name: /forbidden/i })).toBeTruthy()
  })

  it('redirects to /forbidden when user has no qualifying permission', async () => {
    useAuthStore.getState().setUser(USER_WITH_PERMISSIONS(['some:other']))
    renderPermissionGuarded(['role:create', 'role:update', 'role:delete'], '/admin/roles')
    expect(await screen.findByRole('heading', { name: /forbidden/i })).toBeTruthy()
  })

  it('redirects to /forbidden when user is null', async () => {
    renderPermissionGuarded(['role:create'], '/admin/roles')
    expect(await screen.findByRole('heading', { name: /forbidden/i })).toBeTruthy()
  })

  it('renders children when user has one qualifying permission (any match)', async () => {
    useAuthStore.getState().setUser(USER_WITH_PERMISSIONS(['role:update']))
    renderPermissionGuarded(['role:create', 'role:update', 'role:delete'], '/admin/roles')
    expect(await screen.findByRole('heading', { name: /roles page/i })).toBeTruthy()
  })

  it('renders children when user has all required permissions', async () => {
    useAuthStore.getState().setUser(USER_WITH_PERMISSIONS(['role:create', 'role:delete']))
    renderPermissionGuarded(['role:create', 'role:delete'], '/admin/roles')
    expect(await screen.findByRole('heading', { name: /roles page/i })).toBeTruthy()
  })

  it('redirects when requireAll is true and user is missing one permission', async () => {
    useAuthStore.getState().setUser(USER_WITH_PERMISSIONS(['role:create']))
    renderPermissionGuarded(['role:create', 'role:delete'], '/admin/roles', true)
    expect(await screen.findByRole('heading', { name: /forbidden/i })).toBeTruthy()
  })

  it('renders children when requireAll is true and user has all permissions', async () => {
    useAuthStore.getState().setUser(USER_WITH_PERMISSIONS(['role:create', 'role:delete']))
    renderPermissionGuarded(['role:create', 'role:delete'], '/admin/roles', true)
    expect(await screen.findByRole('heading', { name: /roles page/i })).toBeTruthy()
  })

  it('logs FORBIDDEN_ROUTE_ACCESS_ATTEMPT with userId and path on redirect', async () => {
    const { logger } = await import('@/lib/logger')
    const logSpy = vi.spyOn(logger, 'log')

    useAuthStore.getState().setUser(USER_WITH_PERMISSIONS([]))
    renderPermissionGuarded(['role:create'], '/admin/roles')

    await screen.findByRole('heading', { name: /forbidden/i })

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'FORBIDDEN_ROUTE_ACCESS_ATTEMPT',
        userId: 'u1',
        path: '/admin/roles',
      }),
    )
  })
})
