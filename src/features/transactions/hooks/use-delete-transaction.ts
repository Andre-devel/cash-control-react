import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteTransaction } from '@/features/transactions/api/transactions.api'
import { toast } from '@/lib/toast'
import { TRANSACTIONS_QUERY_KEY } from './use-transactions'
import { ACCOUNTS_QUERY_KEY } from '@/features/accounts/hooks/use-accounts'
import type { NormalizedError } from '@/features/auth/types'

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, string>({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY })
      toast.success('Transaction deleted successfully.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
