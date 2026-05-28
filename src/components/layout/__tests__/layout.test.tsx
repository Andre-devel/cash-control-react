import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sidebar } from '../sidebar'
import { Topbar } from '../topbar'
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

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function renderSidebar(initialPath = '/dashboard') {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Sidebar />
      </MemoryRouter>
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

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

describe('Sidebar', () => {
  it('renders the Cash Control brand', () => {
    renderSidebar()
    expect(screen.getByText('Cash Control')).toBeTruthy()
  })

  it('renders the logo element', () => {
    const { container } = renderSidebar()
    expect(container.querySelector('.logo')).toBeTruthy()
  })

  it('renders all Geral nav items', () => {
    renderSidebar()
    expect(screen.getByText('Dashboard')).toBeTruthy()
    expect(screen.getByText('Transações')).toBeTruthy()
    expect(screen.getByText('Contas')).toBeTruthy()
    expect(screen.getByText('Cartões')).toBeTruthy()
  })

  it('renders all Gestão nav items', () => {
    renderSidebar()
    expect(screen.getByText('Categorias')).toBeTruthy()
    expect(screen.getByText('Parcelamentos')).toBeTruthy()
    expect(screen.getByText('Recorrências')).toBeTruthy()
  })

  it('renders all section labels', () => {
    renderSidebar()
    expect(screen.getByText('Geral')).toBeTruthy()
    expect(screen.getByText('Gestão')).toBeTruthy()
    expect(screen.getByText('Sistema')).toBeTruthy()
  })

  it('renders Sistema nav items', () => {
    renderSidebar()
    expect(screen.getByText('Configurações')).toBeTruthy()
  })

  it('applies active class to the current route nav item', () => {
    const { container } = renderSidebar('/dashboard')
    const activeItem = container.querySelector('.nav-item.active')
    expect(activeItem).toBeTruthy()
    expect(activeItem!.textContent).toContain('Dashboard')
  })

  it('applies active class to accounts item when at /accounts', () => {
    const { container } = renderSidebar('/accounts')
    const activeItem = container.querySelector('.nav-item.active')
    expect(activeItem).toBeTruthy()
    expect(activeItem!.textContent).toContain('Contas')
  })

  it('applies active class to accounts item when at a sub-route /accounts/123', () => {
    const { container } = renderSidebar('/accounts/123')
    const activeItem = container.querySelector('.nav-item.active')
    expect(activeItem).toBeTruthy()
    expect(activeItem!.textContent).toContain('Contas')
  })

  it('dashboard is only active at exact /dashboard', () => {
    const { container } = renderSidebar('/transactions')
    const activeItems = container.querySelectorAll('.nav-item.active')
    const dashboardItem = Array.from(activeItems).find((el) =>
      el.textContent?.includes('Dashboard'),
    )
    expect(dashboardItem).toBeUndefined()
  })

  it('renders user name in footer', () => {
    renderSidebar()
    expect(screen.getByText('Test User')).toBeTruthy()
  })

  it('renders user email in footer', () => {
    renderSidebar()
    expect(screen.getByText('user@example.com')).toBeTruthy()
  })

  it('renders avatar in footer', () => {
    const { container } = renderSidebar()
    expect(container.querySelector('.avatar')).toBeTruthy()
  })

  it('renders sidebar-foot element', () => {
    const { container } = renderSidebar()
    expect(container.querySelector('.sidebar-foot')).toBeTruthy()
  })

  it('renders theme toggle button', () => {
    renderSidebar()
    const themeBtn = screen.getByRole('button', { name: /mudar para modo/i })
    expect(themeBtn).toBeTruthy()
  })

  it('calls setTheme when theme toggle is clicked', async () => {
    const user = userEvent.setup()
    const setTheme = vi.fn()
    useAuthStore.setState({ theme: 'dark', setTheme } as never)
    renderSidebar()
    const themeBtn = screen.getByRole('button', { name: /mudar para modo/i })
    await user.click(themeBtn)
    expect(setTheme).toHaveBeenCalledWith('light')
  })

  it('renders sidebar-nav with aria-label', () => {
    renderSidebar()
    expect(screen.getByRole('navigation', { name: /navegação principal/i })).toBeTruthy()
  })

  it('renders all nav-item elements', () => {
    const { container } = renderSidebar()
    const navItems = container.querySelectorAll('.nav-item')
    expect(navItems.length).toBeGreaterThanOrEqual(8)
  })

  it('renders sidebar-brand element', () => {
    const { container } = renderSidebar()
    expect(container.querySelector('.sidebar-brand')).toBeTruthy()
  })

  it('renders aside with sidebar class', () => {
    const { container } = renderSidebar()
    expect(container.querySelector('aside.sidebar')).toBeTruthy()
  })

  it('shows fallback initials when no user name', () => {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false, theme: 'dark' })
    const { container } = renderSidebar()
    expect(container.querySelector('.avatar')!.textContent).toBe('CC')
  })
})

// ---------------------------------------------------------------------------
// Topbar
// ---------------------------------------------------------------------------

describe('Topbar', () => {
  it('renders header element with topbar class', () => {
    const { container } = render(
      <MemoryRouter>
        <Topbar />
      </MemoryRouter>,
    )
    expect(container.querySelector('header.topbar')).toBeTruthy()
  })

  it('renders breadcrumb when breadcrumb prop is provided', () => {
    render(
      <MemoryRouter>
        <Topbar breadcrumb={['Contas']} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Contas')).toBeTruthy()
  })

  it('renders last breadcrumb item in bold', () => {
    const { container } = render(
      <MemoryRouter>
        <Topbar breadcrumb={['Home', 'Contas']} />
      </MemoryRouter>,
    )
    const bold = container.querySelector('.breadcrumb b')
    expect(bold!.textContent).toBe('Contas')
  })

  it('renders earlier breadcrumb items as span', () => {
    render(
      <MemoryRouter>
        <Topbar breadcrumb={['Home', 'Contas']} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Home').tagName).toBe('SPAN')
  })

  it('renders title as h1 when no breadcrumb', () => {
    render(
      <MemoryRouter>
        <Topbar title="Dashboard" />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeTruthy()
  })

  it('prefers breadcrumb over title when both provided', () => {
    render(
      <MemoryRouter>
        <Topbar breadcrumb={['Contas']} title="Dashboard" />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('heading')).toBeNull()
    expect(screen.getByText('Contas')).toBeTruthy()
  })

  it('renders children in right slot', () => {
    render(
      <MemoryRouter>
        <Topbar>
          <button>Logout</button>
        </Topbar>
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: 'Logout' })).toBeTruthy()
  })

  it('renders spacer element', () => {
    const { container } = render(
      <MemoryRouter>
        <Topbar />
      </MemoryRouter>,
    )
    expect(container.querySelector('.spacer')).toBeTruthy()
  })

  it('renders nothing in header left when no breadcrumb and no title', () => {
    render(
      <MemoryRouter>
        <Topbar />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('heading')).toBeNull()
    expect(document.querySelector('.breadcrumb')).toBeNull()
  })

  it('renders banner role (header element)', () => {
    render(
      <MemoryRouter>
        <Topbar title="Test" />
      </MemoryRouter>,
    )
    expect(screen.getByRole('banner')).toBeTruthy()
  })

  it('renders single-item breadcrumb with last item in bold', () => {
    const { container } = render(
      <MemoryRouter>
        <Topbar breadcrumb={['Dashboard']} />
      </MemoryRouter>,
    )
    expect(container.querySelector('.breadcrumb b')!.textContent).toBe('Dashboard')
  })

  it('renders chevron separator between breadcrumb items', () => {
    const { container } = render(
      <MemoryRouter>
        <Topbar breadcrumb={['Finance', 'Contas', 'Detalhes']} />
      </MemoryRouter>,
    )
    const breadcrumb = container.querySelector('.breadcrumb')!
    expect(breadcrumb.querySelectorAll('svg').length).toBe(2)
  })
})
