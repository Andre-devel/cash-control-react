import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAccount } from '@/features/accounts/api/accounts.api'
import { toast } from '@/lib/toast'
import { ACCOUNTS_QUERY_KEY } from './use-accounts'
import type { CreateAccountRequest, Account } from '@/features/accounts/types'
import type { NormalizedError } from '@/features/auth/types'

export function useCreateAccount() {
  const queryClient = useQueryClient()

  return useMutation<Account, NormalizedError, CreateAccountRequest>({
    mutationFn: createAccount,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY })
      toast.success('Account created successfully.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
