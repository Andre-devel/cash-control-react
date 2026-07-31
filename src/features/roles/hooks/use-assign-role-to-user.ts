import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assignRoleToUser } from '@/features/roles/api'
import { toast } from '@/lib/toast'
import type { NormalizedError } from '@/features/auth/types'

interface AssignRoleToUserVariables {
  userId: string
  roleId: string
}

interface UseAssignRoleToUserOptions {
  onSuccess?: () => void
}

export function useAssignRoleToUser(options?: UseAssignRoleToUserOptions) {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, AssignRoleToUserVariables>({
    mutationFn: ({ userId, roleId }) => assignRoleToUser(userId, roleId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'detail', userId] })
      toast.success('Papel atribuído ao usuário.')
      options?.onSuccess?.()
    },
    onError: (error) => {
      if (error.status === 409) {
        toast.error('Papel já atribuído a este usuário.')
        return
      }
      toast.error(error.message)
    },
  })
}
