import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthenticatedLayout } from '../authenticated-layout'
import { useAuthStore } from '@/features/auth/store/auth.store'

vi.mock('@/styles/theme/dark-mode', () => ({
  applyTheme: vi.fn(),
  resolveTheme: vi.fn((t: string) => (t === 'light' ? 'light' : 'dark')),
  getStoredTheme: vi.fn(() => null),
  storeTheme: vi.fn(),
  getSystemTheme: vi.fn(() => 'dark'),
  initializeTheme: vi.fn(),
}))

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn() },
  LOG_EVENTS: { LOGOUT: 'LOGOUT' },
}))

function makeRouter(initialPath = '/dashboard') {
  return createMemoryRouter(
    [
      {
        element: <AuthenticatedLayout />,
        children: [
          { path: '/dashboard', element: <h1>Dashboard</h1> },
          { path: '/accounts', element: <h1>Contas</h1> },
          { path: '/accounts/:id', element: <h1>Conta Detalhe</h1> },
          { path: '/transactions', element: <h1>Transações</h1> },
        ],
      },
    ],
    { initialEntries: [initialPath] },
  )
}

function renderLayout(initialPath = '/dashboard') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={makeRouter(initialPath)} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  useAuthStore.setState({
    user: { id: 'u1', email: 'user@example.com', name: 'Test User', roles: ['USER'] },
    token: 'tok',
    isAuthenticated: true,
    theme: 'dark',
  })
})

afterEach(() => {
  cleanup()
  useAuthStore.getState().clearSession()
})

describe('AuthenticatedLayout', () => {
  it('renders the app shell div', () => {
    const { container } = renderLayout()
    expect(container.querySelector('.app')).toBeTruthy()
  })

  it('renders the sidebar', () => {
    const { container } = renderLayout()
    expect(container.querySelector('aside.sidebar')).toBeTruthy()
  })

  it('renders the shell div', () => {
    const { container } = renderLayout()
    expect(container.querySelector('.shell')).toBeTruthy()
  })

  it('renders the topbar header', () => {
    renderLayout()
    expect(screen.getByRole('banner')).toBeTruthy()
  })

  it('renders the main content area', () => {
    renderLayout()
    expect(screen.getByRole('main')).toBeTruthy()
  })

  it('main has id="main-content" for skip link', () => {
    renderLayout()
    const main = screen.getByRole('main')
    expect(main.id).toBe('main-content')
  })

  it('main has content class', () => {
    renderLayout()
    expect(screen.getByRole('main').className).toContain('content')
  })

  it('renders skip-to-content link', () => {
    const { container } = renderLayout()
    const skipLink = container.querySelector('a[href="#main-content"]')
    expect(skipLink).toBeTruthy()
  })

  it('renders page content inside main', async () => {
    renderLayout('/dashboard')
    const main = screen.getByRole('main')
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeTruthy()
    expect(main.querySelector('h1')!.textContent).toBe('Dashboard')
  })

  it('renders logout button in topbar', () => {
    renderLayout()
    expect(screen.getByRole('button', { name: /sair/i })).toBeTruthy()
  })

  it('renders breadcrumb for dashboard route', () => {
    const { container } = renderLayout('/dashboard')
    const breadcrumb = container.querySelector('.breadcrumb')
    expect(breadcrumb).toBeTruthy()
    expect(breadcrumb!.textContent).toContain('Dashboard')
  })

  it('renders breadcrumb for accounts route', () => {
    const { container } = renderLayout('/accounts')
    const breadcrumb = container.querySelector('.breadcrumb')
    expect(breadcrumb!.textContent).toContain('Contas')
  })

  it('renders accounts breadcrumb when at sub-route /accounts/:id', () => {
    const { container } = renderLayout('/accounts/some-id')
    const breadcrumb = container.querySelector('.breadcrumb')
    expect(breadcrumb!.textContent).toContain('Contas')
  })

  it('renders Cash Control brand in sidebar', () => {
    renderLayout()
    expect(screen.getByText('Cash Control')).toBeTruthy()
  })
})
