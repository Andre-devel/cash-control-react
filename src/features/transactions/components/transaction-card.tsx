import { memo } from 'react'
import { Button } from '@/components/ui/button'
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
import type { Transaction } from '@/features/transactions/types'
import type { Account } from '@/features/accounts/types'
import type { Category } from '@/features/categories/types'

interface TransactionCardProps {
  transaction: Transaction
  accounts: Account[]
  /** Lista achatada (raízes + subcategorias) — ver `flattenCategories`. */
  categories: Category[]
  onEdit: (t: Transaction) => void
  onDelete: (t: Transaction) => void
  onPay: (t: Transaction) => void
  onCancel: (t: Transaction) => void
  onView: (t: Transaction) => void
  /** Abre a série de parcelamento — usado no lugar das ações por parcela. */
  onViewSeries?: (t: Transaction) => void
}

/**
 * Versão da linha de transação para telas estreitas. A tabela completa tem ~1300 px
 * e no celular só a descrição fica visível, então abaixo de 768 px a grid é trocada
 * por esta lista de cards — ver `.only-mobile` / `.only-desktop` em globals.css.
 */
export const TransactionCard = memo(function TransactionCard({
  transaction,
  accounts,
  categories,
  onEdit,
  onDelete,
  onPay,
  onCancel,
  onView,
  onViewSeries,
}: TransactionCardProps) {
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
    <div className="tx-card" style={{ opacity: isCancelled ? 0.6 : 1 }}>
      <div className="tx-card-top">
        <IconBubble color={bubbleColor} icon={icon} size="sm" />
        <button
          type="button"
          className="tx-card-desc"
          onClick={() =>
            isSeries && onViewSeries ? onViewSeries(transaction) : onView(transaction)
          }
        >
          {transaction.description}
        </button>
        <span className="tx-card-amount mono" style={{ color: amountColor }}>
          <Money value={amountValue} signed={isIncome} />
        </span>
      </div>

      <div className="tx-card-meta">
        {category ? (
          <span className="tx-card-chip">
            <span className="tx-card-dot" style={{ background: category.color }} />
            {category.name}
          </span>
        ) : null}
        {account ? (
          <span className="tx-card-chip">
            <span
              className="tx-card-dot"
              style={{ background: 'var(--accent)', borderRadius: 99 }}
            />
            {account.name}
          </span>
        ) : null}
        <span className="tx-card-chip">{transaction.paymentMethod.name}</span>
        {installments && (
          <span
            className="tx-card-chip mono"
            title={
              isSeries
                ? `Compra parcelada em ${transaction.totalInstallments}x` +
                  (transaction.paidInstallments != null
                    ? ` · ${transaction.paidInstallments} de ${transaction.totalInstallments} pagas`
                    : '')
                : `Parcela ${transaction.installmentNumber} de ${transaction.totalInstallments}`
            }
          >
            {installments}
          </span>
        )}
      </div>

      <div className="tx-card-badges">
        <TypeBadge type={transaction.type} amount={amountValue} />
        <StatusBadge status={transaction.status} />
      </div>

      <div className="tx-card-actions">
        {/* Numa linha de série, pagar/editar/excluir valem para a série inteira e vivem
            na tela de Parcelamentos — a API recusa essas operações parcela a parcela. */}
        {isSeries && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => (onViewSeries ? onViewSeries(transaction) : onView(transaction))}
          >
            Ver parcelas
          </Button>
        )}
        {!isSeries && transaction.status === 'PENDING' && (
          <Button type="button" size="sm" variant="ghost" onClick={() => onPay(transaction)}>
            Pagar
          </Button>
        )}
        {!isSeries && !isCancelled && (
          <Button type="button" size="sm" variant="ghost" onClick={() => onEdit(transaction)}>
            Editar
          </Button>
        )}
        {!isSeries && !isCancelled && (
          <Button type="button" size="sm" variant="ghost" onClick={() => onCancel(transaction)}>
            Cancelar
          </Button>
        )}
        {!isSeries && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            style={{ color: 'var(--expense)' }}
            onClick={() => onDelete(transaction)}
          >
            Excluir
          </Button>
        )}
      </div>
    </div>
  )
})
