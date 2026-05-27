import { useMutation, useQueryClient } from '@tanstack/react-query'
import { revokeRoleFromUser } from '@/features/roles/api'
import { toast } from '@/lib/toast'
import type { NormalizedError } from '@/features/auth/types'

interface RevokeRoleFromUserVariables {
  userId: string
  roleId: string
}

interface UseRevokeRoleFromUserOptions {
  onSuccess?: () => void
}

export function useRevokeRoleFromUser(options?: UseRevokeRoleFromUserOptions) {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, RevokeRoleFromUserVariables>({
    mutationFn: ({ userId, roleId }) => revokeRoleFromUser(userId, roleId),
    retry: false,
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'detail', userId] })
      toast.success('Role removed from user.')
      options?.onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
