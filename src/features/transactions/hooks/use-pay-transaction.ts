import { useMutation, useQueryClient } from '@tanstack/react-query'
import { payTransaction } from '@/features/transactions/api/transactions.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { TRANSACTIONS_QUERY_KEY } from './use-transactions'
import { ACCOUNTS_QUERY_KEY } from '@/features/accounts/hooks/use-accounts'
import type { Transaction } from '@/features/transactions/types'
import type { NormalizedError } from '@/features/auth/types'

export interface PayTransactionInput {
  id: string
  paymentDate?: string
}

export function usePayTransaction() {
  const queryClient = useQueryClient()

  return useMutation<Transaction, NormalizedError, PayTransactionInput>({
    mutationFn: ({ id, paymentDate }) =>
      payTransaction(id, paymentDate ? { paymentDate } : undefined),
    onSuccess: () => {
      invalidateFinancialQueries(queryClient, [TRANSACTIONS_QUERY_KEY, ACCOUNTS_QUERY_KEY])
      toast.success('Transação marcada como paga.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
