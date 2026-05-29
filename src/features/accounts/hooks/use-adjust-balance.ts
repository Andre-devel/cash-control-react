import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adjustBalance } from '@/features/accounts/api/accounts.api'
import { toast } from '@/lib/toast'
import { ACCOUNTS_QUERY_KEY } from './use-accounts'
import type { AdjustBalanceRequest, Account } from '@/features/accounts/types'
import type { NormalizedError } from '@/features/auth/types'

interface AdjustBalanceVariables {
  id: string
  data: AdjustBalanceRequest
}

export function useAdjustBalance() {
  const queryClient = useQueryClient()

  return useMutation<Account, NormalizedError, AdjustBalanceVariables>({
    mutationFn: ({ id, data }) => adjustBalance(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: [...ACCOUNTS_QUERY_KEY, id] })
      toast.success('Balance adjusted successfully.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
