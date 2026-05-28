import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { registerApi } from '@/features/auth/api/auth.api'
import { toast } from '@/lib/toast'
import { ROUTES } from '@/app/router/routes'
import type { RegisterFormValues } from '@/features/auth/schemas/register.schema'
import type { MessageResponse } from '@/features/auth/types'
import type { NormalizedError } from '@/features/auth/types'

export function useRegister() {
  const navigate = useNavigate()

  return useMutation<MessageResponse, NormalizedError, RegisterFormValues>({
    mutationFn: ({ confirmPassword: _discarded, ...data }) => registerApi(data),
    onSuccess: (data) => {
      toast.success(data.message || 'Conta criada! Verifique seu e-mail para ativar.')
      navigate(`${ROUTES.VERIFY_EMAIL}?pending=true`, { replace: true })
    },
  })
}
