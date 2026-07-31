import { useMutation, useQueryClient } from '@tanstack/react-query'
import { unarchiveAccount } from '@/features/accounts/api/accounts.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { ACCOUNTS_QUERY_KEY } from './use-accounts'
import type { Account } from '@/features/accounts/types'
import type { NormalizedError } from '@/features/auth/types'

export function useUnarchiveAccount() {
  const queryClient = useQueryClient()

  return useMutation<Account, NormalizedError, string>({
    mutationFn: unarchiveAccount,
    onSuccess: (updatedAccount) => {
      queryClient.setQueryData<Account>([...ACCOUNTS_QUERY_KEY, updatedAccount.id], updatedAccount)
      queryClient.setQueriesData<Account[]>({ queryKey: ACCOUNTS_QUERY_KEY }, (old) => {
        if (!Array.isArray(old)) return old
        const inList = old.some((a) => a.id === updatedAccount.id)
        if (inList) {
          return old.map((a) => (a.id === updatedAccount.id ? updatedAccount : a))
        }
        // Account not in this list yet — add it if this is a non-archived list
        const isNonArchivedList = !old.some((a) => a.archivedAt)
        return isNonArchivedList ? [...old, updatedAccount] : old
      })
      invalidateFinancialQueries(queryClient)
      toast.success('Conta restaurada.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
