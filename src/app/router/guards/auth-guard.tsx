import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { logger, LOG_EVENTS } from '@/lib/logger'
import { ROUTES } from '@/app/router/routes'

export function AuthGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    logger.log({
      event: LOG_EVENTS.UNAUTHORIZED_ROUTE_ACCESS_ATTEMPT,
      path: location.pathname,
    })
    const redirectTo = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`${ROUTES.LOGIN}?redirect=${redirectTo}`} replace />
  }

  return <Outlet />
}
