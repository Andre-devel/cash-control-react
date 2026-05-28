import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { changePasswordApi } from '@/features/auth/api/auth.api'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { queryClient } from '@/app/providers/query-provider'
import { toast } from '@/lib/toast'
import { ROUTES } from '@/app/router/routes'
import type { NormalizedError } from '@/features/auth/types'

interface ChangePasswordVariables {
  currentPassword: string
  newPassword: string
}

export function useChangePassword() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((s) => s.clearSession)

  return useMutation<void, NormalizedError, ChangePasswordVariables>({
    mutationFn: ({ currentPassword, newPassword }) =>
      changePasswordApi(currentPassword, newPassword),
    onSuccess: () => {
      clearSession()
      queryClient.clear()
      toast.success('Senha alterada com sucesso. Faça login novamente.')
      navigate(ROUTES.LOGIN, { replace: true })
    },
  })
}
