import { useMutation, useQueryClient } from '@tanstack/react-query'
import { archiveAccount } from '@/features/accounts/api/accounts.api'
import { toast } from '@/lib/toast'
import { ACCOUNTS_QUERY_KEY } from './use-accounts'
import type { Account } from '@/features/accounts/types'
import type { NormalizedError } from '@/features/auth/types'

export function useArchiveAccount() {
  const queryClient = useQueryClient()

  return useMutation<Account, NormalizedError, string>({
    mutationFn: archiveAccount,
    onSuccess: (updatedAccount) => {
      queryClient.setQueryData<Account>([...ACCOUNTS_QUERY_KEY, updatedAccount.id], updatedAccount)
      queryClient.setQueriesData<Account[]>({ queryKey: ACCOUNTS_QUERY_KEY }, (old) => {
        if (!Array.isArray(old)) return old
        const updated = old.map((a) => (a.id === updatedAccount.id ? updatedAccount : a))
        // If no archived items existed before, this is a non-archived list — filter the account out
        return old.some((a) => a.archivedAt) ? updated : updated.filter((a) => !a.archivedAt)
      })
      toast.success('Account archived.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
