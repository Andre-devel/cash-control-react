import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reopenInvoice } from '@/features/invoices/api/invoices.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
import { ACCOUNTS_QUERY_KEY } from '@/features/accounts/hooks/use-accounts'
import { CARDS_QUERY_KEY } from '@/features/cards/hooks/use-cards'
import { INVOICES_QUERY_KEY } from './use-invoices'
import type { Invoice } from '@/features/cards/types'
import type { NormalizedError } from '@/features/auth/types'

export function useReopenInvoice() {
  const queryClient = useQueryClient()

  return useMutation<Invoice, NormalizedError, string>({
    mutationFn: (invoiceId) => reopenInvoice(invoiceId),
    onSuccess: () => {
      invalidateFinancialQueries(queryClient, [
        CARDS_QUERY_KEY,
        INVOICES_QUERY_KEY,
        TRANSACTIONS_QUERY_KEY,
        ACCOUNTS_QUERY_KEY,
      ])
      toast.success('Fatura reaberta.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
