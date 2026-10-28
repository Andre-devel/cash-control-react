import { memo } from 'react'
import { Money } from '@/components/ui/money'
import { IconBubble } from '@/components/ui/icon-bubble'
import { StatusBadge } from '@/components/ui/status-badge'
import { TypeBadge } from '@/components/ui/type-badge'
import {
  TRANSACTION_TYPE_DISPLAY,
  isPositiveTransaction,
  transactionTypeColor,
} from '@/features/transactions/utils/transaction-type'
import {
  effectiveAmount,
  installmentLabel,
  isInstallmentGroup,
} from '@/features/transactions/utils/installment'
import {
  TransactionActions,
  type TransactionActionHandlers,
} from '@/features/transactions/components/transaction-actions'
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

interface TransactionRowProps extends TransactionActionHandlers {
  transaction: Transaction
  accounts: Account[]
  /** Lista achatada (raízes + subcategorias) — ver `flattenCategories`. */
  categories: Category[]
}

export const TransactionRow = memo(function TransactionRow({
  transaction,
  accounts,
  categories,
  onEdit,
  onDelete,
  onPay,
  onCancel,
  onReactivate,
  onView,
  onViewSeries,
}: TransactionRowProps) {
  const category = transaction.categoryId
    ? categories.find((c) => c.id === transaction.categoryId)
    : null
  const account = accounts.find((a) => a.id === transaction.accountId)
  const isSeries = isInstallmentGroup(transaction)
  const amountValue = effectiveAmount(transaction)
  const installments = installmentLabel(transaction)
  const { icon } = TRANSACTION_TYPE_DISPLAY[transaction.type]
  const bubbleColor = category?.color ?? transactionTypeColor(transaction.type, amountValue)
  const isCancelled = transaction.status === 'CANCELLED'
  const isIncome = isPositiveTransaction(transaction.type, amountValue)
  const amountColor = isIncome ? 'var(--income)' : 'var(--text)'

  return (
    <tr style={{ opacity: isCancelled ? 0.6 : 1 }}>
      <td style={{ paddingLeft: 16, whiteSpace: 'normal', minWidth: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconBubble color={bubbleColor} icon={icon} size="sm" />
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
            onClick={() =>
              isSeries && onViewSeries ? onViewSeries(transaction) : onView(transaction)
            }
          >
            {transaction.description}
          </button>
          {installments && (
            <span
              className="mono"
              title={
                isSeries
                  ? `Compra parcelada em ${transaction.totalInstallments}x` +
                    (transaction.paidInstallments != null
                      ? ` · ${transaction.paidInstallments} de ${transaction.totalInstallments} pagas`
                      : '')
                  : `Parcela ${transaction.installmentNumber} de ${transaction.totalInstallments}`
              }
              style={{
                flexShrink: 0,
                fontSize: 11,
                fontWeight: 500,
                padding: '1px 6px',
                borderRadius: 4,
                color: 'var(--text-dim)',
                background: 'var(--surface-3)',
              }}
            >
              {installments}
            </span>
          )}
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
                background: 'var(--accent)',
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
      <td
        style={{
          whiteSpace: 'nowrap',
          maxWidth: 140,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        <span style={{ fontSize: 12.5 }}>{transaction.paymentMethod.name}</span>
      </td>
      <td>
        <TypeBadge type={transaction.type} amount={amountValue} />
      </td>
      <td>
        <StatusBadge status={transaction.status} />
      </td>
      <td className="text-xs text-dim">{fmtDateShort(transaction.competenceDate)}</td>
      <td className="text-xs text-dim">
        {transaction.paymentDate && !isCancelled ? fmtDateShort(transaction.paymentDate) : '—'}
      </td>
      <td className="num" style={{ paddingRight: 8, color: amountColor, fontWeight: 500 }}>
        <Money value={amountValue} signed={isIncome} />
      </td>
      <td style={{ paddingRight: 8 }}>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          <TransactionActions
            transaction={transaction}
            onEdit={onEdit}
            onDelete={onDelete}
            onPay={onPay}
            onCancel={onCancel}
            onReactivate={onReactivate}
            onView={onView}
            onViewSeries={onViewSeries}
          />
        </div>
      </td>
    </tr>
  )
})
