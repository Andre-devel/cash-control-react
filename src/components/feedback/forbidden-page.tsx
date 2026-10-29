import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/app/router/routes'
import { StatusPage } from './status-page'

export default function ForbiddenPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // Aberta direto (sem histórico): "Voltar" leva ao dashboard em vez de não fazer nada.
  function goBack() {
    if (location.key !== 'default') navigate(-1)
    else navigate(ROUTES.DASHBOARD)
  }

  return (
    <StatusPage
      code="403"
      icon={Lock}
      tone="pending"
      title="Você não tem permissão"
      description="Você não tem permissão para acessar esta página. Peça a um administrador para incluir a permissão na sua função."
      actions={
        <>
          <Button variant="primary" size="lg" className="w-full" onClick={goBack}>
            Voltar
          </Button>
          <Button asChild variant="ghost" size="lg" className="w-full">
            <Link to={ROUTES.DASHBOARD}>Ir para o dashboard</Link>
          </Button>
        </>
      }
    />
  )
}
