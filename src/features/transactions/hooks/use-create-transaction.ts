import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTransaction } from '@/features/transactions/api/transactions.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { TRANSACTIONS_QUERY_KEY } from './use-transactions'
import { ACCOUNTS_QUERY_KEY } from '@/features/accounts/hooks/use-accounts'
import { CARDS_QUERY_KEY } from '@/features/cards/hooks/use-cards'
import type { CreateTransactionRequest, Transaction } from '@/features/transactions/types'
import type { NormalizedError } from '@/features/auth/types'

interface UseCreateTransactionOptions {
  onFieldError?: (error: NormalizedError) => void
}

export function useCreateTransaction(options?: UseCreateTransactionOptions) {
  const queryClient = useQueryClient()

  return useMutation<Transaction, NormalizedError, CreateTransactionRequest>({
    mutationFn: createTransaction,
    onSuccess: () => {
      invalidateFinancialQueries(queryClient, [
        TRANSACTIONS_QUERY_KEY,
        ACCOUNTS_QUERY_KEY,
        CARDS_QUERY_KEY,
      ])
      toast.success('Transação criada com sucesso.')
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
