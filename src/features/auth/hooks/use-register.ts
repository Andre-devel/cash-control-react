import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { registerApi } from '@/features/auth/api/auth.api'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { decodeJwtPayload } from '@/lib/jwt'
import { toast } from '@/lib/toast'
import { ROUTES } from '@/app/router/routes'
import type { RegisterFormValues } from '@/features/auth/schemas/register.schema'
import type { RegisterResponse } from '@/features/auth/api/auth.api'
import type { NormalizedError } from '@/features/auth/types'

export function useRegister() {
  const navigate = useNavigate()
  const setToken = useAuthStore((s) => s.setToken)
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation<RegisterResponse, NormalizedError, RegisterFormValues>({
    mutationFn: ({ confirmPassword: _discarded, ...data }) => registerApi(data),
    onSuccess: (data) => {
      if (data.token) {
        setToken(data.token)
        const payload = decodeJwtPayload(data.token)
        if (payload) {
          setUser({
            id: payload.sub ?? '',
            email: payload.email ?? '',
            name: payload.name ?? '',
            roles: payload.roles ?? [],
          })
        }
        navigate(ROUTES.DASHBOARD, { replace: true })
      } else {
        toast.success('Account created! Please sign in.')
        navigate(ROUTES.LOGIN, { replace: true })
      }
    },
  })
}
