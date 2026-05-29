import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateAccount } from '@/features/accounts/api/accounts.api'
import { toast } from '@/lib/toast'
import { ACCOUNTS_QUERY_KEY } from './use-accounts'
import type { UpdateAccountRequest, Account } from '@/features/accounts/types'
import type { NormalizedError } from '@/features/auth/types'

interface UpdateAccountVariables {
  id: string
  data: UpdateAccountRequest
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()

  return useMutation<Account, NormalizedError, UpdateAccountVariables>({
    mutationFn: ({ id, data }) => updateAccount(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: [...ACCOUNTS_QUERY_KEY, id] })
      toast.success('Account updated successfully.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
