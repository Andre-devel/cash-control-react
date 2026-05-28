import { Outlet, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/features/auth/hooks/use-logout'
import { ROUTES } from '@/app/router/routes'

const ROUTE_LABELS: Array<{ path: string; label: string }> = [
  { path: ROUTES.DASHBOARD, label: 'Dashboard' },
  { path: ROUTES.TRANSACTIONS, label: 'Transações' },
  { path: ROUTES.ACCOUNTS, label: 'Contas' },
  { path: ROUTES.CARDS, label: 'Cartões' },
  { path: ROUTES.CATEGORIES, label: 'Categorias' },
  { path: ROUTES.INSTALLMENTS, label: 'Parcelamentos' },
  { path: ROUTES.RECURRENCES, label: 'Recorrências' },
  { path: ROUTES.PROFILE, label: 'Configurações' },
  { path: ROUTES.ROLES, label: 'Funções' },
]

function getBreadcrumb(pathname: string): string[] {
  const match = ROUTE_LABELS.find((r) => {
    if (r.path === ROUTES.DASHBOARD) return pathname === r.path
    return pathname === r.path || pathname.startsWith(r.path + '/')
  })
  return match ? [match.label] : []
}

export function AuthenticatedLayout() {
  const logout = useLogout()
  const location = useLocation()
  const breadcrumb = getBreadcrumb(location.pathname)

  return (
    <div className="app">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-bg focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:ring-accent"
      >
        Ir para o conteúdo
      </a>
      <Sidebar />
      <div className="shell">
        <Topbar breadcrumb={breadcrumb.length > 0 ? breadcrumb : undefined}>
          <Button variant="ghost" size="icon" onClick={logout} aria-label="Sair" title="Sair">
            <LogOut size={16} aria-hidden="true" />
          </Button>
        </Topbar>
        <main id="main-content" className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
