import { useMutation } from '@tanstack/react-query'
import { resendVerificationApi } from '@/features/auth/api/auth.api'
import type { MessageResponse, NormalizedError } from '@/features/auth/types'

export function useResendVerification() {
  return useMutation<MessageResponse, NormalizedError, string>({
    mutationFn: (email) => resendVerificationApi(email),
  })
}
