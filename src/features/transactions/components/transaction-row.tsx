import { memo } from 'react'
import { Money } from '@/components/ui/money'
import { IconBubble } from '@/components/ui/icon-bubble'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  TransactionActions,
  type TransactionActionHandlers,
} from '@/features/transactions/components/transaction-actions'
import {
  describeTransaction,
  fmtDateMedium,
  fmtDateShort,
} from '@/features/transactions/utils/transaction-display'
import type { Transaction } from '@/features/transactions/types'
import type { Account } from '@/features/accounts/types'
import type { Category } from '@/features/categories/types'
import '@/features/transactions/transactions.css'
import { categoryColorCss } from '@/features/categories/utils/category-colors'

interface TransactionRowProps extends TransactionActionHandlers {
  transaction: Transaction
  accounts: Account[]
  /** Lista achatada (raízes + subcategorias) — ver `flattenCategories`. */
  categories: Category[]
}

/** Linha da tabela densa (≥ 1024 px). O card equivalente fica em `TransactionCard`. */
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
  const d = describeTransaction(transaction, accounts, categories)
  const paidOn =
    transaction.paymentDate &&
    !d.isCancelled &&
    transaction.paymentDate !== transaction.competenceDate
      ? ` · pago ${fmtDateShort(transaction.paymentDate)}`
      : ''

  return (
    <tr className={`tx-row${d.isCancelled ? ' opacity-60' : ''}`}>
      <td className="!pl-4 min-w-[200px] !whitespace-normal">
        <div className="flex items-center gap-3">
          <IconBubble color={d.bubbleColor} icon={d.icon} size="sm" aria-hidden />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={`rounded-xs text-left text-body text-fg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info${
                  d.isCancelled ? ' line-through' : ''
                }`}
                onClick={() =>
                  d.isSeries && onViewSeries ? onViewSeries(transaction) : onView(transaction)
                }
              >
                {transaction.description}
              </button>
              {d.installments && (
                <span
                  className="rounded-xs bg-surface-3 px-1.5 py-px font-mono text-overline text-fg-muted"
                  title={d.installmentsTitle}
                >
                  {d.installments}
                </span>
              )}
            </span>
            <span className="text-caption text-fg-muted">
              {d.typeLabel} · {fmtDateMedium(transaction.competenceDate)}
              {paidOn}
            </span>
          </div>
        </div>
      </td>
      <td className="!whitespace-normal">
        {d.category ? (
          <span className="flex items-center gap-1.5 text-body-sm text-fg-muted">
            <span
              aria-hidden="true"
              className="inline-block size-2 shrink-0 rounded-[2px]"
              style={{ background: categoryColorCss(d.category.color) }}
            />
            {d.category.name}
          </span>
        ) : (
          <span className="text-fg-subtle">—</span>
        )}
      </td>
      <td>
        {d.accountLabel ? (
          <span className="flex flex-col gap-0.5 text-body-sm">
            <span>{d.accountLabel}</span>
            {transaction.creditCard && (
              <span className="text-caption text-fg-muted">{transaction.creditCard.name}</span>
            )}
          </span>
        ) : (
          <span className="text-fg-subtle">—</span>
        )}
      </td>
      {/* Forma de pagamento só a partir de 1536 px: com sidebar e painel de filtros a
          tabela não cabia em 1440 px e o Valor ia parar atrás da rolagem lateral. */}
      <td className="hidden max-w-[140px] truncate 2xl:table-cell">
        <span className="text-body-sm text-fg-muted">{transaction.paymentMethod.name}</span>
      </td>
      <td>
        <StatusBadge status={transaction.status} />
      </td>
      <td
        className={`num whitespace-nowrap ${
          d.isCancelled ? 'text-fg-muted line-through' : d.isPositive ? 'text-income' : 'text-fg'
        }`}
      >
        <Money value={d.signedAmount} signed />
      </td>
      <td className="!pr-2">
        <div className="flex items-center justify-end gap-1">
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
