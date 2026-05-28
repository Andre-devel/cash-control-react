import { Link } from 'react-router-dom'
import { ROUTES } from '@/app/router/routes'

export default function NotFoundPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg)' }}
    >
      <div className="text-center">
        <h1 className="fw-700" style={{ fontSize: 64 }}>
          404
        </h1>
        <p className="mt-2 text-dim">Page not found.</p>
        <Link
          to={ROUTES.LOGIN}
          className="mt-4 inline-block hover:underline"
          style={{ color: 'var(--accent)' }}
        >
          Go to login
        </Link>
      </div>
    </div>
  )
}
