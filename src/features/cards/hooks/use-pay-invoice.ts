import { useMutation, useQueryClient } from '@tanstack/react-query'
import { payInvoice } from '@/features/cards/api/cards.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
import { ACCOUNTS_QUERY_KEY } from '@/features/accounts/hooks/use-accounts'
import { CARDS_QUERY_KEY } from './use-cards'
import type { PayInvoiceRequest } from '@/features/cards/types'
import type { NormalizedError } from '@/features/auth/types'

export function usePayInvoice() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, { invoiceId: string; data: PayInvoiceRequest }>({
    mutationFn: ({ invoiceId, data }) => payInvoice(invoiceId, data),
    onSuccess: () => {
      invalidateFinancialQueries(queryClient, [
        CARDS_QUERY_KEY,
        ACCOUNTS_QUERY_KEY,
        TRANSACTIONS_QUERY_KEY,
      ])
      toast.success('Pagamento da fatura registrado com sucesso.')
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
