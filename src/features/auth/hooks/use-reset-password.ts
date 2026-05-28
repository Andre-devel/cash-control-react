import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { resetPasswordApi } from '@/features/auth/api/auth.api'
import { toast } from '@/lib/toast'
import { ROUTES } from '@/app/router/routes'
import type { MessageResponse, NormalizedError } from '@/features/auth/types'

interface ResetPasswordVariables {
  token: string
  newPassword: string
}

export function useResetPassword() {
  const navigate = useNavigate()

  return useMutation<MessageResponse, NormalizedError, ResetPasswordVariables>({
    mutationFn: ({ token, newPassword }) => resetPasswordApi(token, newPassword),
    onSuccess: () => {
      toast.success('Senha redefinida com sucesso. Faça login para continuar.')
      navigate(ROUTES.LOGIN, { replace: true })
    },
  })
}
