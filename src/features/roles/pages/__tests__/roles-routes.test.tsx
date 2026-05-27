import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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

function makeValidToken(): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64')
  const payload = Buffer.from(
    JSON.stringify({
      sub: 'u1',
      email: 'user@example.com',
      name: 'Test User',
      roles: ['ADMIN'],
      permissions: ['role:create', 'role:update', 'role:delete'],
      exp: 9_999_999_999,
      iat: 1,
    }),
  ).toString('base64')
  return `${header}.${payload}.sig`
}

function renderAtPath(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter(routeConfig, { initialEntries: [path] })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.getState().clearSession()
})

afterEach(() => {
  cleanup()
})

describe('Roles routes', () => {
  it('renders /admin/roles without crashing when authenticated with permissions', async () => {
    useAuthStore.getState().setToken(makeValidToken())
    useAuthStore.getState().setUser({
      id: 'u1',
      email: 'user@example.com',
      name: 'Test User',
      roles: ['ADMIN'],
      permissions: ['role:create'],
    })
    renderAtPath('/admin/roles')
    expect(await screen.findByRole('main')).toBeTruthy()
  })

  it('renders /admin/roles/:roleId without crashing when authenticated with permissions', async () => {
    useAuthStore.getState().setToken(makeValidToken())
    useAuthStore.getState().setUser({
      id: 'u1',
      email: 'user@example.com',
      name: 'Test User',
      roles: ['ADMIN'],
      permissions: ['role:update'],
    })
    renderAtPath('/admin/roles/test-role-id')
    expect(await screen.findByRole('main')).toBeTruthy()
  })

  it('redirects unauthenticated access to /admin/roles to login', async () => {
    renderAtPath('/admin/roles')
    expect(await screen.findByRole('heading', { name: /sign in/i }, { timeout: 5000 })).toBeTruthy()
  })

  it('redirects unauthenticated access to /admin/roles/:roleId to login', async () => {
    renderAtPath('/admin/roles/some-id')
    expect(await screen.findByRole('heading', { name: /sign in/i }, { timeout: 5000 })).toBeTruthy()
  })

  it('redirects to /forbidden when authenticated but lacks role permissions', async () => {
    useAuthStore.getState().setToken(makeValidToken())
    useAuthStore.getState().setUser({
      id: 'u1',
      email: 'user@example.com',
      name: 'Test User',
      roles: ['USER'],
      permissions: [],
    })
    renderAtPath('/admin/roles')
    expect(await screen.findByText(/you don't have permission/i)).toBeTruthy()
  })

  it('allows access when user has role:update but not role:create or role:delete', async () => {
    useAuthStore.getState().setToken(makeValidToken())
    useAuthStore.getState().setUser({
      id: 'u1',
      email: 'user@example.com',
      name: 'Test User',
      roles: ['EDITOR'],
      permissions: ['role:update'],
    })
    renderAtPath('/admin/roles')
    expect(await screen.findByRole('main')).toBeTruthy()
  })
})
