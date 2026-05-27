import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { logger, LOG_EVENTS } from '@/lib/logger'
import { ROUTES } from '@/app/router/routes'

interface RoleGuardProps {
  requiredRoles: string[]
}

export function RoleGuard({ requiredRoles }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  const userRoles = user?.roles ?? []
  const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role))

  if (!hasRequiredRole) {
    logger.log({
      event: LOG_EVENTS.FORBIDDEN_ROUTE_ACCESS_ATTEMPT,
      path: location.pathname,
      requiredRoles,
    })
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return <Outlet />
}
