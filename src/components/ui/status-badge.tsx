import { CircleAlert, CircleCheck, CircleSlash, Clock } from 'lucide-react'
import { Badge } from './badge'

const STATUS_MAP = {
  PAID: { kind: 'paid' as const, label: 'Pago', Icon: CircleCheck },
  PENDING: { kind: 'pending' as const, label: 'Pendente', Icon: Clock },
  OVERDUE: { kind: 'overdue' as const, label: 'Vencida', Icon: CircleAlert },
  CANCELLED: { kind: 'cancelled' as const, label: 'Cancelado', Icon: CircleSlash },
}

interface StatusBadgeProps {
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED'
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.PENDING
  return (
    <Badge kind={s.kind} icon={<s.Icon aria-hidden="true" />}>
      {s.label}
    </Badge>
  )
}
