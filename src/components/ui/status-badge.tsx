import { Badge } from './badge'

const STATUS_MAP = {
  PAID: { kind: 'paid' as const, label: 'Pago' },
  PENDING: { kind: 'pending' as const, label: 'Pendente' },
  OVERDUE: { kind: 'cancelled' as const, label: 'Vencida' },
  CANCELLED: { kind: 'cancelled' as const, label: 'Cancelado' },
}

interface StatusBadgeProps {
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED'
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.PENDING
  return <Badge kind={s.kind}>{s.label}</Badge>
}
