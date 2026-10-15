import type { BadgeKind } from '@/components/ui/badge'
import type { Invoice, InvoiceStatus } from '@/features/cards/types'

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  OPEN: 'Aberta',
  CLOSED: 'Fechada',
  PAID: 'Paga',
  PARTIAL: 'Parcial',
  OVERDUE: 'Vencida',
}

export function invoiceStatusBadgeKind(status: InvoiceStatus): BadgeKind {
  switch (status) {
    case 'PAID':
      return 'paid'
    case 'OVERDUE':
      return 'cancelled'
    case 'PARTIAL':
      return 'pending'
    case 'CLOSED':
      return 'info'
    default:
      return 'muted'
  }
}

/** Data local no formato `aaaa-mm-dd`, comparável com as datas que a API devolve. */
function localIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * Espelha `CreditCardServiceImpl.payInvoice`: aceita pagamento a fatura que deve algo e já
 * fechou. Uma ABERTA cujo fechamento já passou também vale — o job noturno que a passa para
 * FECHADA pode ainda não ter rodado.
 */
export function canPayInvoice(
  invoice: Pick<Invoice, 'status' | 'totalAmount' | 'paidAmount' | 'closingDate'>,
  today: Date = new Date(),
): boolean {
  if (invoice.status === 'PAID') return false
  if (parseFloat(invoice.totalAmount) - parseFloat(invoice.paidAmount) <= 0) return false
  if (invoice.status !== 'OPEN') return true
  return !!invoice.closingDate && invoice.closingDate < localIsoDate(today)
}
