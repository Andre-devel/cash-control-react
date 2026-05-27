import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assignPermissionToRole } from '@/features/roles/api'
import { roleKeys } from '@/features/roles/api'
import { toast } from '@/lib/toast'
import type { NormalizedError } from '@/features/auth/types'

interface AssignPermissionVariables {
  roleId: string
  permissionId: string
}

interface UseAssignPermissionToRoleOptions {
  onSuccess?: () => void
}

export function useAssignPermissionToRole(options?: UseAssignPermissionToRoleOptions) {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, AssignPermissionVariables>({
    mutationFn: ({ roleId, permissionId }) => assignPermissionToRole(roleId, permissionId),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(roleId) })
      toast.success('Permission assigned to role.')
      options?.onSuccess?.()
    },
    onError: (error) => {
      if (error.status === 409) {
        toast.error('Permission already assigned to this role.')
        return
      }
      toast.error(error.message)
    },
  })
}
