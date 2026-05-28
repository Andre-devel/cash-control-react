import { useMutation } from '@tanstack/react-query'
import { verifyEmailApi } from '@/features/auth/api/auth.api'
import type { MessageResponse, NormalizedError } from '@/features/auth/types'

export function useVerifyEmail() {
  return useMutation<MessageResponse, NormalizedError, string>({
    mutationFn: (token) => verifyEmailApi(token),
  })
}
