import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { logger, LOG_EVENTS } from '@/lib/logger'
import { ROUTES } from '@/app/router/routes'

interface PermissionGuardProps {
  requiredPermissions: string[]
  requireAll?: boolean
}

export function PermissionGuard({ requiredPermissions, requireAll = false }: PermissionGuardProps) {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  const userPermissions = user?.permissions ?? []

  const hasPermission = requireAll
    ? requiredPermissions.every((perm) => userPermissions.includes(perm))
    : requiredPermissions.some((perm) => userPermissions.includes(perm))

  if (!hasPermission) {
    logger.log({
      event: LOG_EVENTS.FORBIDDEN_ROUTE_ACCESS_ATTEMPT,
      userId: user?.id,
      path: location.pathname,
    })
    return <Navigate to={ROUTES.FORBIDDEN} replace />
  }

  return <Outlet />
}
