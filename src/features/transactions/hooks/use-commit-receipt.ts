import { useMutation, useQueryClient } from '@tanstack/react-query'
import { commitReceipt } from '@/features/transactions/api/receipt-import.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { TRANSACTIONS_QUERY_KEY } from './use-transactions'
import { ACCOUNTS_QUERY_KEY } from '@/features/accounts/hooks/use-accounts'
import { CARDS_QUERY_KEY } from '@/features/cards/hooks/use-cards'
import type { ReceiptCommitRequest, Transaction } from '@/features/transactions/types'
import type { NormalizedError } from '@/features/auth/types'

interface CommitReceiptInput {
  data: ReceiptCommitRequest
  file: File
}

interface UseCommitReceiptOptions {
  onFieldError?: (error: NormalizedError) => void
}

export function useCommitReceipt(options?: UseCommitReceiptOptions) {
  const queryClient = useQueryClient()

  return useMutation<Transaction, NormalizedError, CommitReceiptInput>({
    mutationFn: ({ data, file }) => commitReceipt(data, file),
    onSuccess: () => {
      invalidateFinancialQueries(queryClient, [
        TRANSACTIONS_QUERY_KEY,
        ACCOUNTS_QUERY_KEY,
        CARDS_QUERY_KEY,
      ])
      toast.success('Comprovante lançado.')
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
