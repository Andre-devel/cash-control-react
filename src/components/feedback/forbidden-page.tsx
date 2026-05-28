import { Link } from 'react-router-dom'
import { ROUTES } from '@/app/router/routes'

export default function ForbiddenPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg)' }}
    >
      <div className="text-center">
        <h1 className="fw-700" style={{ fontSize: 64 }}>
          403
        </h1>
        <p className="mt-2 text-dim">You don&apos;t have permission to access this page.</p>
        <Link
          to={ROUTES.DASHBOARD}
          className="mt-4 inline-block hover:underline"
          style={{ color: 'var(--accent)' }}
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
