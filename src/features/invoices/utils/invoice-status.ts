import type { BadgeKind } from '@/components/ui/badge'
import type { Invoice, InvoiceStatus } from '@/features/cards/types'
import { daysUntil, localIsoDate } from '@/lib/local-date'

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
  return hasClosed(invoice, today)
}

/**
 * Espelha `InvoiceManagementServiceImpl.settle`: "marcar como paga" só depois do fechamento —
 * uma fatura ABERTA ainda recebe compras, que entrariam numa fatura dada como paga.
 */
export function canSettleInvoice(
  invoice: Pick<Invoice, 'status' | 'closingDate'>,
  today: Date = new Date(),
): boolean {
  return invoice.status !== 'PAID' && hasClosed(invoice, today)
}

function hasClosed(invoice: Pick<Invoice, 'status' | 'closingDate'>, today: Date): boolean {
  if (invoice.status !== 'OPEN') return true
  return !!invoice.closingDate && invoice.closingDate < localIsoDate(today)
}

/** O selo do vencimento: "Paga", "Vence em N dias" ou "Venceu há N dias". */
export function dueBadge(
  invoice: Pick<Invoice, 'status' | 'dueDate'>,
  today: Date = new Date(),
): { kind: BadgeKind; label: string } {
  if (invoice.status === 'PAID') return { kind: 'paid', label: 'Paga' }
  const days = daysUntil(invoice.dueDate, today)
  if (days < 0) {
    const late = -days
    return { kind: 'cancelled', label: `Venceu há ${late} ${late === 1 ? 'dia' : 'dias'}` }
  }
  if (days === 0) return { kind: 'pending', label: 'Vence hoje' }
  return {
    kind: days <= 3 ? 'pending' : 'info',
    label: `Vence em ${days} ${days === 1 ? 'dia' : 'dias'}`,
  }
}
