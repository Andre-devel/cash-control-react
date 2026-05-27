import { Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/features/auth/hooks/use-logout'

export function ProtectedLayout() {
  const logout = useLogout()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border h-14 flex items-center justify-between px-4">
        <span className="font-semibold text-foreground">Cash Control</span>
        <Button variant="ghost" size="sm" onClick={logout}>
          Sign out
        </Button>
      </header>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  )
}
