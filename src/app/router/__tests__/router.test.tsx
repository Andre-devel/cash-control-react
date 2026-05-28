import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeConfig } from '../router'
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
      roles: ['USER'],
      exp: 9_999_999_999,
      iat: 1,
    }),
  ).toString('base64')
  return `${header}.${payload}.sig`
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.getState().clearSession()
})

afterEach(() => {
  cleanup()
})

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

describe('Router', () => {
  it('renders login page at /login', async () => {
    renderAtPath('/login')
    expect(
      await screen.findByRole('heading', { name: /bem-vindo de volta/i }, { timeout: 5000 }),
    ).toBeTruthy()
  })

  it('renders register page at /register', async () => {
    renderAtPath('/register')
    expect(
      await screen.findByRole('heading', { name: /crie sua conta/i }, { timeout: 5000 }),
    ).toBeTruthy()
  })

  it('redirects unauthenticated access to /dashboard to /login', async () => {
    renderAtPath('/dashboard')
    expect(
      await screen.findByRole('heading', { name: /bem-vindo de volta/i }, { timeout: 5000 }),
    ).toBeTruthy()
  })

  it('renders dashboard page at /dashboard when authenticated', async () => {
    useAuthStore.getState().setToken(makeValidToken())
    useAuthStore.getState().setUser({
      id: 'u1',
      email: 'user@example.com',
      name: 'Test User',
      roles: ['USER'],
    })
    renderAtPath('/dashboard')
    expect(await screen.findByRole('heading', { name: /olá/i }, { timeout: 5000 })).toBeTruthy()
  })

  it('renders 404 page for unknown routes', async () => {
    renderAtPath('/unknown-route')
    expect(await screen.findByRole('heading', { name: '404' }, { timeout: 5000 })).toBeTruthy()
  })

  it('redirects root / to the login page', async () => {
    renderAtPath('/')
    expect(
      await screen.findByRole('heading', { name: /bem-vindo de volta/i }, { timeout: 5000 }),
    ).toBeTruthy()
  })

  it('redirects authenticated users away from /login to /dashboard', async () => {
    useAuthStore.getState().setToken(makeValidToken())
    useAuthStore.getState().setUser({
      id: 'u1',
      email: 'user@example.com',
      name: 'Test User',
      roles: ['USER'],
    })
    renderAtPath('/login')
    expect(await screen.findByRole('heading', { name: /olá/i }, { timeout: 5000 })).toBeTruthy()
  })

  it('redirects authenticated users away from /register to /dashboard', async () => {
    useAuthStore.getState().setToken(makeValidToken())
    useAuthStore.getState().setUser({
      id: 'u1',
      email: 'user@example.com',
      name: 'Test User',
      roles: ['USER'],
    })
    renderAtPath('/register')
    expect(await screen.findByRole('heading', { name: /olá/i }, { timeout: 5000 })).toBeTruthy()
  })
})

describe('Router — layout accessibility', () => {
  it('public layout renders a <main> landmark for login route', async () => {
    renderAtPath('/login')
    await screen.findByRole('heading', { name: /bem-vindo de volta/i }, { timeout: 5000 })
    expect(screen.getByRole('main')).toBeTruthy()
  })

  it('public layout renders a <main> landmark for register route', async () => {
    renderAtPath('/register')
    await screen.findByRole('heading', { name: /crie sua conta/i }, { timeout: 5000 })
    expect(screen.getByRole('main')).toBeTruthy()
  })

  it('protected layout renders a <main> landmark and <header> for the dashboard route', async () => {
    useAuthStore.getState().setToken(makeValidToken())
    useAuthStore.getState().setUser({
      id: 'u1',
      email: 'user@example.com',
      name: 'Test User',
      roles: ['USER'],
    })
    renderAtPath('/dashboard')
    await screen.findByRole('heading', { name: /olá/i }, { timeout: 5000 })
    expect(screen.getByRole('main')).toBeTruthy()
    expect(screen.getByRole('banner')).toBeTruthy()
  })
})
