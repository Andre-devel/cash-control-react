import { useMutation } from '@tanstack/react-query'
import { forgotPasswordApi } from '@/features/auth/api/auth.api'
import type { MessageResponse, NormalizedError } from '@/features/auth/types'

export function useForgotPassword() {
  return useMutation<MessageResponse, NormalizedError, string>({
    mutationFn: (email) => forgotPasswordApi(email),
  })
}
