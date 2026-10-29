import { memo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { CircleCheck } from 'lucide-react'
import { Money } from '@/components/ui/money'
import { IconBubble } from '@/components/ui/icon-bubble'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  TransactionActions,
  type TransactionActionHandlers,
} from '@/features/transactions/components/transaction-actions'
import { describeTransaction } from '@/features/transactions/utils/transaction-display'
import { canPayTransaction } from '@/features/transactions/utils/transaction-status'
import type { Transaction } from '@/features/transactions/types'
import type { Account } from '@/features/accounts/types'
import type { Category } from '@/features/categories/types'
import '@/features/transactions/transactions.css'

/** Até onde o card anda e a partir de onde soltar conta como "marcar paga". */
const SWIPE_MAX = 136
const SWIPE_THRESHOLD = 96
/** Movimento mínimo antes de decidir se o gesto é horizontal (deslizar) ou vertical (rolar). */
const SWIPE_SLOP = 8

interface TransactionCardProps extends TransactionActionHandlers {
  transaction: Transaction
  accounts: Account[]
  /** Lista achatada (raízes + subcategorias) — ver `flattenCategories`. */
  categories: Category[]
}

/**
 * Versão da linha de transação para telas estreitas (< 1024 px), alimentada pela mesma
 * página de dados da tabela. No toque, deslizar o card para a direita marca como paga —
 * é só um atalho: a mesma ação está no menu "…" e no detalhe.
 */
export const TransactionCard = memo(function TransactionCard({
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
}: TransactionCardProps) {
  const d = describeTransaction(transaction, accounts, categories)
  const swipeEnabled = !d.isSeries && canPayTransaction(transaction)

  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const gesture = useRef<{ x: number; y: number; axis: 'h' | 'v' | null } | null>(null)
  const suppressClick = useRef(false)

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!swipeEnabled || e.pointerType !== 'touch') return
    gesture.current = { x: e.clientX, y: e.clientY, axis: null }
    suppressClick.current = false
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current
    if (!g) return
    const moveX = e.clientX - g.x
    const moveY = e.clientY - g.y
    if (g.axis === null) {
      if (Math.abs(moveX) > SWIPE_SLOP && Math.abs(moveX) > Math.abs(moveY)) {
        g.axis = 'h'
        e.currentTarget.setPointerCapture?.(e.pointerId)
        setDragging(true)
      } else if (Math.abs(moveY) > SWIPE_SLOP) {
        g.axis = 'v'
      }
    }
    if (g.axis === 'h') {
      suppressClick.current = true
      setDx(Math.max(0, Math.min(SWIPE_MAX, moveX)))
    }
  }

  function endGesture() {
    if (gesture.current?.axis === 'h' && dx >= SWIPE_THRESHOLD) onPay(transaction)
    gesture.current = null
    setDragging(false)
    setDx(0)
  }

  const openDetail = () =>
    d.isSeries && onViewSeries ? onViewSeries(transaction) : onView(transaction)

  return (
    <div
      className={`relative overflow-hidden rounded-xl${swipeEnabled ? ' bg-paid-soft' : ''}${
        d.isCancelled ? ' opacity-60' : ''
      }`}
    >
      {swipeEnabled && (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center gap-2 pl-5 text-body font-semibold text-paid"
          style={{ opacity: Math.min(1, dx / SWIPE_THRESHOLD) }}
        >
          <CircleCheck size={20} />
          Marcar paga
        </div>
      )}

      <div
        className="tx-swipe-fg relative flex items-start gap-3 rounded-xl border border-border bg-surface-1 py-3 pl-3.5 pr-1.5"
        data-dragging={dragging}
        style={{ transform: dx ? `translateX(${dx}px)` : undefined }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            e.preventDefault()
            e.stopPropagation()
            suppressClick.current = false
          }
        }}
      >
        <span className="mt-0.5 shrink-0">
          <IconBubble color={d.bubbleColor} icon={d.icon} aria-hidden />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="sr-only">{d.typeLabel}</span>
          {/* O botão da descrição cobre o card todo (after:inset-0); o menu fica acima dele. */}
          <button
            type="button"
            className={`truncate text-left text-body text-fg after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-info${
              d.isCancelled ? ' line-through' : ''
            }`}
            onClick={openDetail}
          >
            {transaction.description}
          </button>
          <span className="truncate text-caption text-fg-muted">
            {[d.category?.name, d.accountLabel].filter(Boolean).join(' · ') || d.typeLabel}
          </span>
          <span className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={transaction.status} />
            <span className="font-mono text-overline font-medium normal-case tracking-normal text-fg-muted">
              {transaction.creditCard?.name ?? transaction.paymentMethod.name}
            </span>
            {d.installments && (
              <span
                className="rounded-xs bg-surface-3 px-1.5 py-px font-mono text-overline text-fg-muted"
                title={d.installmentsTitle}
              >
                {d.installments}
              </span>
            )}
          </span>
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-0.5 self-center">
          <span
            className={`whitespace-nowrap text-body font-semibold ${
              d.isCancelled
                ? 'text-fg-muted line-through'
                : d.isPositive
                  ? 'text-income'
                  : 'text-fg'
            }`}
          >
            <Money value={d.signedAmount} signed />
          </span>
          <TransactionActions
            transaction={transaction}
            payPlacement="menu"
            onEdit={onEdit}
            onDelete={onDelete}
            onPay={onPay}
            onCancel={onCancel}
            onReactivate={onReactivate}
            onView={onView}
            onViewSeries={onViewSeries}
          />
        </div>
      </div>
    </div>
  )
})
