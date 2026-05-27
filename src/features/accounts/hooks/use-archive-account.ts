import { useMutation, useQueryClient } from '@tanstack/react-query'
import { archiveAccount } from '@/features/accounts/api/accounts.api'
import { toast } from '@/lib/toast'
import { ACCOUNTS_QUERY_KEY } from './use-accounts'
import type { NormalizedError } from '@/features/auth/types'

export function useArchiveAccount() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, string>({
    mutationFn: archiveAccount,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY })
      toast.success('Account archived.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
