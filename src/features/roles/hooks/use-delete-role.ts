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
      toast.success('Papel excluído com sucesso.')
      options?.onSuccess?.()
    },
    onError: (error) => {
      if (error.status === 409) {
        toast.error('O papel ainda está atribuído a usuários — remova todas as atribuições antes.')
        return
      }
      toast.error(error.message)
    },
  })
}
