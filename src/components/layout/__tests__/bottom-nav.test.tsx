import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BottomNav } from '../bottom-nav'
import { Sidebar } from '../sidebar'
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

function renderWithProviders(ui: ReactNode, path = '/dashboard') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

function setUser(permissions: string[]) {
  useAuthStore.setState({
    user: { id: 'u1', email: 'user@example.com', name: 'Test User', roles: ['USER'], permissions },
    token: 'tok',
    isAuthenticated: true,
    theme: 'dark',
  })
}

beforeEach(() => setUser([]))

afterEach(() => {
  cleanup()
  useAuthStore.getState().clearSession()
})

describe('BottomNav', () => {
  it('shows the three fixed destinations, the FAB and "Mais"', () => {
    renderWithProviders(<BottomNav />)
    const nav = screen.getByRole('navigation', { name: 'Navegação principal' })
    expect(within(nav).getByRole('link', { name: 'Início' })).toBeTruthy()
    expect(within(nav).getByRole('link', { name: 'Transações' })).toBeTruthy()
    expect(within(nav).getByRole('link', { name: 'Cartões' })).toBeTruthy()
    expect(within(nav).getByRole('button', { name: 'Novo lançamento' })).toBeTruthy()
    expect(within(nav).getByRole('button', { name: 'Mais' })).toBeTruthy()
  })

  it('opens the quick actions menu from the FAB', async () => {
    renderWithProviders(<BottomNav />)
    await userEvent.click(screen.getByRole('button', { name: 'Novo lançamento' }))
    const dialog = screen.getByRole('dialog', { name: 'Novo lançamento' })
    expect(within(dialog).getByText('Nova transação')).toBeTruthy()
    expect(within(dialog).getByText('Lançar comprovante')).toBeTruthy()
    expect(within(dialog).getByText('Transferência')).toBeTruthy()
    expect(within(dialog).getByText('Importar extrato')).toBeTruthy()
  })

  it('lists the remaining sections in "Mais" and hides items without permission', async () => {
    renderWithProviders(<BottomNav />)
    await userEvent.click(screen.getByRole('button', { name: 'Mais' }))
    const sheet = screen.getByRole('dialog', { name: 'Mais' })
    expect(within(sheet).getByRole('link', { name: 'Contas' })).toBeTruthy()
    expect(within(sheet).getByRole('link', { name: 'Recorrências' })).toBeTruthy()
    expect(within(sheet).queryByRole('link', { name: 'Transações' })).toBeNull()
    expect(within(sheet).queryByRole('link', { name: 'Auditoria' })).toBeNull()
    expect(within(sheet).queryByRole('link', { name: 'Funções' })).toBeNull()
  })

  it('shows admin items in "Mais" when the user has the permissions', async () => {
    setUser(['audit:view', 'role:update'])
    renderWithProviders(<BottomNav />)
    await userEvent.click(screen.getByRole('button', { name: 'Mais' }))
    const sheet = screen.getByRole('dialog', { name: 'Mais' })
    expect(within(sheet).getByRole('link', { name: 'Auditoria' })).toBeTruthy()
    expect(within(sheet).getByRole('link', { name: 'Funções' })).toBeTruthy()
  })

  it('switches the theme from the "Mais" sheet', async () => {
    renderWithProviders(<BottomNav />)
    await userEvent.click(screen.getByRole('button', { name: 'Mais' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Sistema' }))
    expect(useAuthStore.getState().theme).toBe('system')
  })

  it('highlights "Mais" on a page without its own shortcut', () => {
    renderWithProviders(<BottomNav />, '/accounts')
    expect(screen.getByRole('button', { name: 'Mais' }).className).toContain('active')
  })
})

describe('Sidebar permissions', () => {
  it('removes Funções and Auditoria without permission', () => {
    renderWithProviders(<Sidebar />)
    expect(screen.queryByRole('link', { name: 'Auditoria' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Funções' })).toBeNull()
  })
})
