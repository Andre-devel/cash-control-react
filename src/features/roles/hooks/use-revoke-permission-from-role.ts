import { useMutation, useQueryClient } from '@tanstack/react-query'
import { revokePermissionFromRole } from '@/features/roles/api'
import { roleKeys } from '@/features/roles/api'
import { toast } from '@/lib/toast'
import type { NormalizedError } from '@/features/auth/types'

interface RevokePermissionVariables {
  roleId: string
  permissionId: string
}

interface UseRevokePermissionFromRoleOptions {
  onSuccess?: () => void
}

export function useRevokePermissionFromRole(options?: UseRevokePermissionFromRoleOptions) {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, RevokePermissionVariables>({
    mutationFn: ({ roleId, permissionId }) => revokePermissionFromRole(roleId, permissionId),
    retry: false,
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(roleId) })
      toast.success('Permission removed from role.')
      options?.onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
