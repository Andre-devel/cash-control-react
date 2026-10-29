import { CircleAlert, CircleCheck, CircleDashed, Info, Lock, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { InvoiceStatus } from '@/features/cards/types'
import {
  INVOICE_STATUS_LABELS,
  invoiceStatusBadgeKind,
} from '@/features/invoices/utils/invoice-status'

const STATUS_ICONS: Record<InvoiceStatus, LucideIcon> = {
  OPEN: Info,
  CLOSED: Lock,
  PAID: CircleCheck,
  PARTIAL: CircleDashed,
  OVERDUE: CircleAlert,
}

/** Selo de situação da fatura: ícone + texto, nunca só a cor. */
export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const Icon = STATUS_ICONS[status] ?? Info
  return (
    <Badge kind={invoiceStatusBadgeKind(status)} icon={<Icon aria-hidden="true" />}>
      {INVOICE_STATUS_LABELS[status] ?? status}
    </Badge>
  )
}
