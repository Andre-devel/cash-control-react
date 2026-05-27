import { Link } from 'react-router-dom'
import { ROUTES } from '@/app/router/routes'

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground">403</h1>
        <p className="mt-2 text-muted-foreground">
          You don&apos;t have permission to access this page.
        </p>
        <Link to={ROUTES.DASHBOARD} className="mt-4 inline-block text-primary hover:underline">
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
