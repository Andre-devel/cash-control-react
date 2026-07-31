import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTransaction } from '@/features/transactions/api/transactions.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { TRANSACTIONS_QUERY_KEY } from './use-transactions'
import { ACCOUNTS_QUERY_KEY } from '@/features/accounts/hooks/use-accounts'
import type { UpdateTransactionRequest, Transaction } from '@/features/transactions/types'
import type { NormalizedError } from '@/features/auth/types'

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation<Transaction, NormalizedError, { id: string; data: UpdateTransactionRequest }>({
    mutationFn: ({ id, data }) => updateTransaction(id, data),
    onSuccess: () => {
      invalidateFinancialQueries(queryClient, [TRANSACTIONS_QUERY_KEY, ACCOUNTS_QUERY_KEY])
      toast.success('Transação atualizada com sucesso.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
