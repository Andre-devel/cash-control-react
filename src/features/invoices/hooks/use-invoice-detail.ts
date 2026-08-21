import { useQuery } from '@tanstack/react-query'
import { getInvoiceById } from '@/features/invoices/api/invoices.api'
import { INVOICES_QUERY_KEY } from './use-invoices'

export function useInvoiceDetail(invoiceId: string) {
  return useQuery({
    queryKey: [...INVOICES_QUERY_KEY, invoiceId],
    queryFn: () => getInvoiceById(invoiceId),
    enabled: !!invoiceId,
  })
}
