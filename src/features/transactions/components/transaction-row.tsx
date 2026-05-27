import { memo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Transaction } from '@/features/transactions/types'

const TYPE_LABELS: Record<string, string> = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
  REFUND: 'Refund',
  ADJUSTMENT: 'Adjustment',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
}

const TYPE_COLORS: Record<string, string> = {
  INCOME: 'text-green-600 dark:text-green-400',
  EXPENSE: 'text-red-600 dark:text-red-400',
  REFUND: 'text-blue-600 dark:text-blue-400',
  ADJUSTMENT: 'text-yellow-600 dark:text-yellow-400',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  CANCELLED: 'bg-muted text-muted-foreground line-through',
}

interface TransactionRowProps {
  transaction: Transaction
  onEdit: (t: Transaction) => void
  onDelete: (t: Transaction) => void
  onPay: (t: Transaction) => void
  onCancel: (t: Transaction) => void
  onView: (t: Transaction) => void
}

export const TransactionRow = memo(function TransactionRow({
  transaction,
  onEdit,
  onDelete,
  onPay,
  onCancel,
  onView,
}: TransactionRowProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center gap-2 rounded-md border border-border p-3',
        transaction.status === 'CANCELLED' && 'opacity-60',
      )}
    >
      <div className="flex-1 min-w-0 space-y-0.5">
        <button
          type="button"
          className="text-sm font-medium truncate hover:underline text-left w-full"
          onClick={() => onView(transaction)}
        >
          {transaction.description}
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('text-xs font-medium', TYPE_COLORS[transaction.type])}>
            {TYPE_LABELS[transaction.type]}
          </span>
          <span
            className={cn('text-xs rounded-full px-2 py-0.5', STATUS_COLORS[transaction.status])}
          >
            {STATUS_LABELS[transaction.status]}
          </span>
          <span className="text-xs text-muted-foreground">{transaction.competenceDate}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className={cn('text-sm font-semibold tabular-nums', TYPE_COLORS[transaction.type])}>
          {transaction.type === 'INCOME' ? '+' : '-'}
          {transaction.amount}
        </span>

        <div className="flex gap-1">
          {transaction.status === 'PENDING' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-[44px] text-xs"
              onClick={() => onPay(transaction)}
            >
              Pay
            </Button>
          )}
          {transaction.status !== 'CANCELLED' && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-[44px] text-xs"
              onClick={() => onEdit(transaction)}
            >
              Edit
            </Button>
          )}
          {transaction.status !== 'CANCELLED' && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-[44px] text-xs text-destructive hover:text-destructive"
              onClick={() => onCancel(transaction)}
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-[44px] text-xs text-destructive hover:text-destructive"
            onClick={() => onDelete(transaction)}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
})
