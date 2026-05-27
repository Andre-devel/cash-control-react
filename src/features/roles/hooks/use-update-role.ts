import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateRole } from '@/features/roles/api'
import { roleKeys } from '@/features/roles/api'
import { toast } from '@/lib/toast'
import type { UpdateRolePayload } from '@/features/roles/types'
import type { NormalizedError } from '@/features/auth/types'

interface UpdateRoleVariables {
  roleId: string
  payload: UpdateRolePayload
}

interface UseUpdateRoleOptions {
  onSuccess?: () => void
}

export function useUpdateRole(options?: UseUpdateRoleOptions) {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, UpdateRoleVariables>({
    mutationFn: ({ roleId, payload }) => updateRole(roleId, payload),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(roleId) })
      toast.success('Role updated successfully.')
      options?.onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
