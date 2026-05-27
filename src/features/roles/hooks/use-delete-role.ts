import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteRole } from '@/features/roles/api'
import { roleKeys } from '@/features/roles/api'
import { toast } from '@/lib/toast'
import type { NormalizedError } from '@/features/auth/types'

interface UseDeleteRoleOptions {
  onSuccess?: () => void
}

export function useDeleteRole(options?: UseDeleteRoleOptions) {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, string>({
    mutationFn: deleteRole,
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
      toast.success('Role deleted successfully.')
      options?.onSuccess?.()
    },
    onError: (error) => {
      if (error.status === 409) {
        toast.error('Role is still assigned to users — remove all assignments first.')
        return
      }
      toast.error(error.message)
    },
  })
}
