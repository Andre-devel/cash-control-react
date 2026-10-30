import { useBankPendingCount } from '@/features/bank-connections/hooks/use-bank-pending'
import type { NavItem } from './nav-config'

/** Selo de contagem de um item do menu; some com zero. */
export function NavBadge({ badge }: { badge: NavItem['badge'] }) {
  if (badge !== 'bank-pending') return null
  return <BankPendingBadge />
}

function BankPendingBadge() {
  const { data: count = 0 } = useBankPendingCount()
  if (count === 0) return null
  return (
    <span className="nav-badge" aria-label={`${count} para revisar`}>
      {count > 99 ? '99+' : count}
    </span>
  )
}
