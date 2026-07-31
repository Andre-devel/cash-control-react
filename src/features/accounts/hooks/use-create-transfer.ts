import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTransfer } from '@/features/accounts/api/accounts.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
import { ACCOUNTS_QUERY_KEY } from './use-accounts'
import type { CreateTransferRequest } from '@/features/accounts/types'
import type { NormalizedError } from '@/features/auth/types'

export function useCreateTransfer() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, CreateTransferRequest>({
    mutationFn: createTransfer,
    onSuccess: () => {
      invalidateFinancialQueries(queryClient, [ACCOUNTS_QUERY_KEY, TRANSACTIONS_QUERY_KEY])
      toast.success('Transferência realizada com sucesso.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
