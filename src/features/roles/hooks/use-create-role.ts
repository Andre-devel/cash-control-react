import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createRole } from '@/features/roles/api'
import { roleKeys } from '@/features/roles/api'
import { toast } from '@/lib/toast'
import type { CreateRolePayload, Role } from '@/features/roles/types'
import type { NormalizedError } from '@/features/auth/types'

interface UseCreateRoleOptions {
  onSuccess?: (role: Role) => void
  onError?: (error: NormalizedError) => void
}

export function useCreateRole(options?: UseCreateRoleOptions) {
  const queryClient = useQueryClient()

  return useMutation<Role, NormalizedError, CreateRolePayload>({
    mutationFn: createRole,
    onSuccess: (role) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() })
      toast.success('Role created successfully.')
      options?.onSuccess?.(role)
    },
    onError: (error) => {
      if (options?.onError) {
        options.onError(error)
        return
      }
      toast.error(error.message)
    },
  })
}
