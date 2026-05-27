import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { isJwtExpired } from '@/lib/jwt'
import { logger, LOG_EVENTS } from '@/lib/logger'
import { ROUTES } from '@/app/router/routes'

export function AuthProvider() {
  const [initialized, setInitialized] = useState(false)
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const clearSession = useAuthStore((s) => s.clearSession)

  useEffect(() => {
    if (token) {
      if (isJwtExpired(token)) {
        logger.log({ event: LOG_EVENTS.SESSION_EXPIRED })
        clearSession()
        navigate(ROUTES.LOGIN, { replace: true })
      } else {
        logger.log({ event: LOG_EVENTS.SESSION_RESTORED })
      }
    }
    setInitialized(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!initialized) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        aria-busy="true"
        aria-label="Initializing application"
      >
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <Outlet />
}
