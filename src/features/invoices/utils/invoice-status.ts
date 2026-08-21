import type { BadgeKind } from '@/components/ui/badge'
import type { InvoiceStatus } from '@/features/cards/types'

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  OPEN: 'Aberta',
  CLOSED: 'Fechada',
  PAID: 'Paga',
  PARTIAL: 'Parcial',
  PARTIALLY_PAID: 'Parcial',
  OVERDUE: 'Vencida',
}

export function invoiceStatusBadgeKind(status: InvoiceStatus): BadgeKind {
  switch (status) {
    case 'PAID':
      return 'paid'
    case 'OVERDUE':
      return 'cancelled'
    case 'PARTIAL':
    case 'PARTIALLY_PAID':
      return 'pending'
    case 'CLOSED':
      return 'info'
    default:
      return 'muted'
  }
}
