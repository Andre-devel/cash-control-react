import { Link } from 'react-router-dom'
import { ROUTES } from '@/app/router/routes'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-muted-foreground">Page not found.</p>
        <Link to={ROUTES.LOGIN} className="mt-4 inline-block text-primary hover:underline">
          Go to login
        </Link>
      </div>
    </div>
  )
}
