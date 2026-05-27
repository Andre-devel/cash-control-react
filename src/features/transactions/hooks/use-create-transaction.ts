import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTransaction } from '@/features/transactions/api/transactions.api'
import { toast } from '@/lib/toast'
import { TRANSACTIONS_QUERY_KEY } from './use-transactions'
import { ACCOUNTS_QUERY_KEY } from '@/features/accounts/hooks/use-accounts'
import type { CreateTransactionRequest, Transaction } from '@/features/transactions/types'
import type { NormalizedError } from '@/features/auth/types'

export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation<Transaction, NormalizedError, CreateTransactionRequest>({
    mutationFn: createTransaction,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY })
      toast.success('Transaction created successfully.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
