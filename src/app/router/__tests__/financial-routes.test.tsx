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
  useAuthStore.getState().setToken(makeValidToken())
  useAuthStore.getState().setUser({
    id: 'u1',
    email: 'user@example.com',
    name: 'Test User',
    roles: ['USER'],
  })
})

afterEach(() => {
  cleanup()
})

describe('Financial feature routes — authenticated rendering', () => {
  it('renders accounts page at /accounts', async () => {
    renderAtPath('/accounts')
    expect(
      await screen.findByRole('heading', { name: /accounts/i }, { timeout: 3000 }),
    ).toBeTruthy()
  })

  it('renders account detail page at /accounts/:id', async () => {
    renderAtPath('/accounts/test-id')
    expect(await screen.findByRole('heading', { name: /account/i })).toBeTruthy()
  })

  it('renders transactions page at /transactions', async () => {
    renderAtPath('/transactions')
    expect(await screen.findByRole('heading', { name: /transactions/i })).toBeTruthy()
  })

  it('renders transaction detail page at /transactions/:id', async () => {
    renderAtPath('/transactions/test-id')
    expect(
      await screen.findByRole('heading', { name: /transaction/i }, { timeout: 5000 }),
    ).toBeTruthy()
  })

  it('renders installments page at /installments', async () => {
    renderAtPath('/installments')
    expect(await screen.findByRole('heading', { name: /installments/i })).toBeTruthy()
  })

  it('renders recurrences page at /recurrences', async () => {
    renderAtPath('/recurrences')
    expect(await screen.findByRole('heading', { name: /recurrences/i })).toBeTruthy()
  })

  it('renders categories page at /categories', async () => {
    renderAtPath('/categories')
    expect(await screen.findByRole('heading', { name: /categories/i })).toBeTruthy()
  })

  it('renders cards page at /cards', async () => {
    renderAtPath('/cards')
    expect(await screen.findByRole('heading', { name: /credit cards/i })).toBeTruthy()
  })

  it('renders card detail page at /cards/:id', async () => {
    renderAtPath('/cards/test-id')
    expect(await screen.findByRole('heading', { name: /card/i }, { timeout: 5000 })).toBeTruthy()
  })

  it('renders profile page at /profile', async () => {
    renderAtPath('/profile')
    expect(await screen.findByRole('heading', { name: /profile/i })).toBeTruthy()
  })
})

describe('Financial feature routes — unauthenticated redirect', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
  })

  it('redirects unauthenticated access to /accounts to /login', async () => {
    renderAtPath('/accounts')
    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeTruthy()
  })

  it('redirects unauthenticated access to /transactions to /login', async () => {
    renderAtPath('/transactions')
    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeTruthy()
  })

  it('redirects unauthenticated access to /profile to /login', async () => {
    renderAtPath('/profile')
    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeTruthy()
  })
})
