import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { getMeApi } from '@/features/auth/api/auth.api'
import { isJwtExpired } from '@/lib/jwt'
import { logger, LOG_EVENTS } from '@/lib/logger'
import { ROUTES } from '@/app/router/routes'

export function AuthProvider() {
  const [initialized, setInitialized] = useState(false)
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const setUser = useAuthStore((s) => s.setUser)
  const clearSession = useAuthStore((s) => s.clearSession)

  useEffect(() => {
    async function init() {
      if (token) {
        if (isJwtExpired(token)) {
          logger.log({ event: LOG_EVENTS.SESSION_EXPIRED })
          clearSession()
          navigate(ROUTES.LOGIN, { replace: true })
        } else {
          logger.log({ event: LOG_EVENTS.SESSION_RESTORED })
          try {
            const profile = await getMeApi()
            setUser({
              id: profile.id,
              email: profile.email,
              name: profile.displayName,
              roles: profile.roles,
              permissions: profile.permissions,
            })
          } catch {
            // Non-fatal: user data will be stale from local store until next reload
          }
        }
      }
      setInitialized(true)
    }

    void init()
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
