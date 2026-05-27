import { useMutation, useQueryClient } from '@tanstack/react-query'
import { unarchiveAccount } from '@/features/accounts/api/accounts.api'
import { toast } from '@/lib/toast'
import { ACCOUNTS_QUERY_KEY } from './use-accounts'
import type { NormalizedError } from '@/features/auth/types'

export function useUnarchiveAccount() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, string>({
    mutationFn: unarchiveAccount,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY })
      toast.success('Account restored.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
