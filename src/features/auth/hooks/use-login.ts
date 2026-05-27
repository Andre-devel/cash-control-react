import { useMutation } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loginApi } from '@/features/auth/api/auth.api'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { decodeJwtPayload } from '@/lib/jwt'
import { toast } from '@/lib/toast'
import { logger, LOG_EVENTS } from '@/lib/logger'
import { ROUTES } from '@/app/router/routes'
import type { LoginFormValues } from '@/features/auth/schemas/login.schema'
import type { LoginResponse } from '@/features/auth/api/auth.api'
import type { NormalizedError } from '@/features/auth/types'

export function useLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setToken = useAuthStore((s) => s.setToken)
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation<LoginResponse, NormalizedError, LoginFormValues>({
    mutationFn: (data) => loginApi(data),
    onSuccess: (data) => {
      setToken(data.accessToken)
      const payload = decodeJwtPayload(data.accessToken)
      if (payload) {
        const permissions = payload.authorities ?? []
        setUser({
          id: payload.sub ?? '',
          email: payload.email ?? '',
          name: payload.name ?? '',
          roles: payload.roles ?? [],
          permissions,
        })
        logger.log({ event: LOG_EVENTS.LOGIN_SUCCESS, permissions })
      }
      const redirectTo = searchParams.get('redirect')
      navigate(redirectTo ? decodeURIComponent(redirectTo) : ROUTES.DASHBOARD, { replace: true })
    },
    onError: (error) => {
      logger.log({
        event: LOG_EVENTS.LOGIN_FAILURE,
        correlationId: error.correlationId,
        errorCode: error.errorCode,
        status: error.status,
      })
      toast.error('Invalid credentials. Please try again.')
    },
  })
}
