import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAccount } from '@/features/accounts/api/accounts.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
import { ACCOUNTS_QUERY_KEY } from './use-accounts'
import type { CreateAccountRequest, Account } from '@/features/accounts/types'
import type { NormalizedError } from '@/features/auth/types'

interface UseCreateAccountOptions {
  onFieldError?: (error: NormalizedError) => void
}

export function useCreateAccount(options?: UseCreateAccountOptions) {
  const queryClient = useQueryClient()

  return useMutation<Account, NormalizedError, CreateAccountRequest>({
    mutationFn: createAccount,
    onSuccess: () => {
      invalidateFinancialQueries(queryClient, [ACCOUNTS_QUERY_KEY, TRANSACTIONS_QUERY_KEY])
      toast.success('Conta criada com sucesso.')
    },
    onError: (error) => {
      if ((error.status === 409 || error.status === 422) && options?.onFieldError) {
        options.onFieldError(error)
        return
      }
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
