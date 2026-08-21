import { useQuery } from '@tanstack/react-query'
import { listInvoices } from '@/features/invoices/api/invoices.api'

export const INVOICES_QUERY_KEY = ['invoices'] as const

export function useInvoices(cardId: string, page = 0, size = 20) {
  return useQuery({
    queryKey: [...INVOICES_QUERY_KEY, 'by-card', cardId, page, size],
    queryFn: () => listInvoices(cardId, page, size),
    enabled: !!cardId,
  })
}
