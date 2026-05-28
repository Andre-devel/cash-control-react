import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { logoutApi } from '@/features/auth/api/auth.api'
import { queryClient } from '@/app/providers/query-provider'
import { logger, LOG_EVENTS } from '@/lib/logger'
import { ROUTES } from '@/app/router/routes'

export function useLogout() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((s) => s.clearSession)

  return useCallback(() => {
    logger.log({ event: LOG_EVENTS.LOGOUT })
    logoutApi().catch(() => {
      // Ignore API errors — always clear local session
    })
    clearSession()
    queryClient.clear()
    navigate(ROUTES.LOGIN, { replace: true })
  }, [clearSession, navigate])
}
