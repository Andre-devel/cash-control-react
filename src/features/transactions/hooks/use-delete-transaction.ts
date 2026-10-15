import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteTransaction } from '@/features/transactions/api/transactions.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { TRANSACTIONS_QUERY_KEY } from './use-transactions'
import { ACCOUNTS_QUERY_KEY } from '@/features/accounts/hooks/use-accounts'
import { CARDS_QUERY_KEY } from '@/features/cards/hooks/use-cards'
import { INVOICES_QUERY_KEY } from '@/features/invoices/hooks/use-invoices'
import type { NormalizedError } from '@/features/auth/types'

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, string>({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      // Excluir um pagamento de fatura muda a fatura e o limite do cartão.
      invalidateFinancialQueries(queryClient, [
        TRANSACTIONS_QUERY_KEY,
        ACCOUNTS_QUERY_KEY,
        CARDS_QUERY_KEY,
        INVOICES_QUERY_KEY,
      ])
      toast.success('Transação excluída com sucesso.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
