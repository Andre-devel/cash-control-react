import { Link } from 'react-router-dom'
import { ROUTES } from '@/app/router/routes'
import { useAuthStore } from '@/features/auth/store/auth.store'

export default function NotFoundPage() {
  const isLoggedIn = useAuthStore((s) => s.token !== null)

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg)' }}
    >
      <div className="text-center">
        <h1 className="fw-700" style={{ fontSize: 64 }}>
          404
        </h1>
        <p className="mt-2 text-dim">Página não encontrada.</p>
        <Link
          to={isLoggedIn ? ROUTES.DASHBOARD : ROUTES.LOGIN}
          className="mt-4 inline-block hover:underline"
          style={{ color: 'var(--accent)' }}
        >
          {isLoggedIn ? 'Ir para o dashboard' : 'Ir para o login'}
        </Link>
      </div>
    </div>
  )
}
