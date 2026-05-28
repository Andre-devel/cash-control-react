import type { ComponentType } from 'react'
import { memo } from 'react'
import { ArrowDownLeft, ArrowUpRight, RotateCcw, ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/ui/money'
import { IconBubble } from '@/components/ui/icon-bubble'
import { StatusBadge } from '@/components/ui/status-badge'
import { TypeBadge } from '@/components/ui/type-badge'
import type { Transaction } from '@/features/transactions/types'
import type { Account } from '@/features/accounts/types'
import type { Category } from '@/features/categories/types'

const MONTH_ABBR_PT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

function fmtDateShort(iso: string): string {
  const parts = iso.split('-')
  const month = parseInt(parts[1] ?? '1', 10) - 1
  const day = parseInt(parts[2] ?? '1', 10)
  return `${String(day).padStart(2, '0')} ${MONTH_ABBR_PT[month] ?? ''}`
}

type BubbleIcon = ComponentType<{ size?: number; stroke?: number }>

function asIcon(i: unknown): BubbleIcon {
  return i as BubbleIcon
}

const TX_TYPE_CONFIG: Record<string, { icon: BubbleIcon; color: string }> = {
  INCOME: { icon: asIcon(ArrowDownLeft), color: 'var(--income)' },
  EXPENSE: { icon: asIcon(ArrowUpRight), color: 'var(--expense)' },
  REFUND: { icon: asIcon(RotateCcw), color: 'var(--income)' },
  TRANSFER: { icon: asIcon(ArrowLeftRight), color: 'var(--info)' },
}

interface TransactionRowProps {
  transaction: Transaction
  accounts: Account[]
  categories: Category[]
  onEdit: (t: Transaction) => void
  onDelete: (t: Transaction) => void
  onPay: (t: Transaction) => void
  onCancel: (t: Transaction) => void
  onView: (t: Transaction) => void
}

export const TransactionRow = memo(function TransactionRow({
  transaction,
  accounts,
  categories,
  onEdit,
  onDelete,
  onPay,
  onCancel,
  onView,
}: TransactionRowProps) {
  const category = transaction.categoryId
    ? categories.find((c) => c.id === transaction.categoryId)
    : null
  const account = accounts.find((a) => a.id === transaction.accountId)
  const cfg =
    TX_TYPE_CONFIG[transaction.type] ??
    (TX_TYPE_CONFIG.EXPENSE as { icon: BubbleIcon; color: string })
  const bubbleColor = category?.color ?? cfg.color
  const amountValue = parseFloat(transaction.amount)
  const isCancelled = transaction.status === 'CANCELLED'
  const isIncome = transaction.type === 'INCOME' || transaction.type === 'REFUND'
  const amountColor = isIncome ? 'var(--income)' : 'var(--text)'

  return (
    <tr style={{ opacity: isCancelled ? 0.6 : 1 }}>
      <td style={{ paddingLeft: 16, width: 32 }}>
        <input type="checkbox" className="checkbox" />
      </td>
      <td style={{ whiteSpace: 'normal', minWidth: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconBubble color={bubbleColor} icon={cfg.icon} size="sm" />
          <button
            type="button"
            style={{
              fontWeight: 500,
              background: 'none',
              border: 0,
              color: 'inherit',
              cursor: 'pointer',
              textAlign: 'left',
              padding: 0,
            }}
            onClick={() => onView(transaction)}
          >
            {transaction.description}
          </button>
        </div>
      </td>
      <td>
        {category ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: category.color,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            {category.name}
          </span>
        ) : (
          <span style={{ color: 'var(--text-faint)' }}>—</span>
        )}
      </td>
      <td>
        {account ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 99,
                background: account.color,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            {account.name}
          </span>
        ) : (
          <span style={{ color: 'var(--text-faint)' }}>—</span>
        )}
      </td>
      <td>
        <TypeBadge type={transaction.type} />
      </td>
      <td>
        <StatusBadge status={transaction.status} />
      </td>
      <td className="text-xs text-dim">{fmtDateShort(transaction.competenceDate)}</td>
      <td className="text-xs text-dim">
        {transaction.paymentDate ? fmtDateShort(transaction.paymentDate) : '—'}
      </td>
      <td className="num" style={{ paddingRight: 8, color: amountColor, fontWeight: 500 }}>
        <Money value={amountValue} signed={isIncome} />
      </td>
      <td style={{ paddingRight: 8 }}>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          {transaction.status === 'PENDING' && (
            <Button type="button" size="sm" variant="ghost" onClick={() => onPay(transaction)}>
              Pagar
            </Button>
          )}
          {!isCancelled && (
            <Button type="button" size="sm" variant="ghost" onClick={() => onEdit(transaction)}>
              Editar
            </Button>
          )}
          {!isCancelled && (
            <Button type="button" size="sm" variant="ghost" onClick={() => onCancel(transaction)}>
              Cancelar
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            style={{ color: 'var(--expense)' }}
            onClick={() => onDelete(transaction)}
          >
            Excluir
          </Button>
        </div>
      </td>
    </tr>
  )
})
