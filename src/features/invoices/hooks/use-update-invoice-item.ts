import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateInvoiceItem } from '@/features/invoices/api/invoices.api'
import { toast } from '@/lib/toast'
import { invalidateFinancialQueries } from '@/lib/invalidate-financial-queries'
import { TRANSACTIONS_QUERY_KEY } from '@/features/transactions/hooks/use-transactions'
import { ACCOUNTS_QUERY_KEY } from '@/features/accounts/hooks/use-accounts'
import { CARDS_QUERY_KEY } from '@/features/cards/hooks/use-cards'
import { INVOICES_QUERY_KEY } from './use-invoices'
import type { UpdateInvoiceItemRequest, UpdateInvoiceItemResponse } from '@/features/invoices/types'
import type { NormalizedError } from '@/features/auth/types'

export function useUpdateInvoiceItem() {
  const queryClient = useQueryClient()

  return useMutation<
    UpdateInvoiceItemResponse,
    NormalizedError,
    { itemId: string; data: UpdateInvoiceItemRequest }
  >({
    mutationFn: ({ itemId, data }) => updateInvoiceItem(itemId, data),
    onSuccess: (response) => {
      invalidateFinancialQueries(queryClient, [
        CARDS_QUERY_KEY,
        INVOICES_QUERY_KEY,
        TRANSACTIONS_QUERY_KEY,
        ACCOUNTS_QUERY_KEY,
      ])
      toast.success(
        response.updatedRelatedItems > 0
          ? `Lançamento atualizado · ${response.updatedRelatedItems} ${
              response.updatedRelatedItems === 1 ? 'anterior ajustado' : 'anteriores ajustados'
            }`
          : 'Lançamento atualizado.',
      )
    },
    onError: (error) => {
      toast.error(error.message, error.status >= 500 ? error.correlationId : undefined)
    },
  })
}
