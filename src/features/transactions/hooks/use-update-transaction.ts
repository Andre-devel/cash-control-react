import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTransaction } from '@/features/transactions/api/transactions.api'
import { toast } from '@/lib/toast'
import { TRANSACTIONS_QUERY_KEY } from './use-transactions'
import { ACCOUNTS_QUERY_KEY } from '@/features/accounts/hooks/use-accounts'
import type { UpdateTransactionRequest, Transaction } from '@/features/transactions/types'
import type { NormalizedError } from '@/features/auth/types'

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation<Transaction, NormalizedError, { id: string; data: UpdateTransactionRequest }>({
    mutationFn: ({ id, data }) => updateTransaction(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY })
      toast.success('Transaction updated successfully.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
