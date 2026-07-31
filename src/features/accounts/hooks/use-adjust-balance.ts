import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adjustBalance } from '@/features/accounts/api/accounts.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
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
      invalidateFinancialQueries(queryClient, [
        ACCOUNTS_QUERY_KEY,
        [...ACCOUNTS_QUERY_KEY, id],
        TRANSACTIONS_QUERY_KEY,
      ])
      toast.success('Saldo ajustado com sucesso.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
