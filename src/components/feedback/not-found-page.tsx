import { Link } from 'react-router-dom'
import { MapPinOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/app/router/routes'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { StatusPage } from './status-page'

export default function NotFoundPage() {
  const isLoggedIn = useAuthStore((s) => s.token !== null)

  return (
    <StatusPage
      fullscreen
      code="404"
      icon={MapPinOff}
      tone="info"
      title="Página não encontrada"
      description="O endereço pode ter mudado ou o item foi excluído."
      actions={
        <Button asChild variant="primary" size="lg" className="w-full">
          <Link to={isLoggedIn ? ROUTES.DASHBOARD : ROUTES.LOGIN}>
            {isLoggedIn ? 'Ir para o dashboard' : 'Ir para o login'}
          </Link>
        </Button>
      }
    />
  )
}
