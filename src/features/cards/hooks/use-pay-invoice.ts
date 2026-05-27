import { useMutation, useQueryClient } from '@tanstack/react-query'
import { payInvoice } from '@/features/cards/api/cards.api'
import { toast } from '@/lib/toast'
import { CARDS_QUERY_KEY } from './use-cards'
import type { PayInvoiceRequest } from '@/features/cards/types'
import type { NormalizedError } from '@/features/auth/types'

export function usePayInvoice() {
  const queryClient = useQueryClient()

  return useMutation<void, NormalizedError, { invoiceId: string; data: PayInvoiceRequest }>({
    mutationFn: ({ invoiceId, data }) => payInvoice(invoiceId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CARDS_QUERY_KEY })
      toast.success('Invoice payment recorded successfully.')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
