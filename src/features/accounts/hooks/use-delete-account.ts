import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteAccount } from '@/features/accounts/api/accounts.api'
import { toast } from '@/lib/toast'
import { ACCOUNTS_QUERY_KEY } from './use-accounts'
import type { NormalizedError } from '@/features/auth/types'

export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, string>({
    mutationFn: deleteAccount,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY })
      toast.success('Account deleted successfully.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
