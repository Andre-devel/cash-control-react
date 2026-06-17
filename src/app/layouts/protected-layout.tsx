import { Outlet } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/features/auth/hooks/use-logout'
import { ROUTES } from '@/app/router/routes'

export function ProtectedLayout() {
  const logout = useLogout()

  return (
    <div className="min-h-screen bg-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-bg focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:ring-accent"
      >
        Ir para o conteúdo
      </a>
      <header className="border-b border-border h-14 flex items-center justify-between px-4">
        <Link to={ROUTES.DASHBOARD} className="font-semibold hover:opacity-80">
          Cash Control
        </Link>
        <nav className="flex items-center gap-2" aria-label="Navegação principal">
          <Button variant="ghost" size="sm" asChild>
            <Link to={ROUTES.PROFILE}>Perfil</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={logout}>
            Sair
          </Button>
        </nav>
      </header>
      <main id="main-content" className="p-4">
        <Outlet />
      </main>
    </div>
  )
}
