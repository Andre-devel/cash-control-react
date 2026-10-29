import { Outlet, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { OfflinePill } from '@/components/layout/offline-pill'
import { currentNavLabel } from '@/components/layout/nav-config'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/features/auth/hooks/use-logout'

export function AuthenticatedLayout() {
  const logout = useLogout()
  const location = useLocation()
  const label = currentNavLabel(location.pathname)

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
        <Topbar breadcrumb={label ? [label] : undefined}>
          <Button variant="ghost" size="icon" onClick={logout} aria-label="Sair" title="Sair">
            <LogOut size={16} aria-hidden="true" />
          </Button>
        </Topbar>
        <OfflinePill />
        <main id="main-content" className="content">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
