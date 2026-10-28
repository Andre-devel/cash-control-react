import { Button } from '@/components/ui/button'
import { ActionMenu, type ActionMenuItem } from '@/components/ui/action-menu'
import {
  canPayTransaction,
  canReactivateTransaction,
  isLockedTransaction,
} from '@/features/transactions/utils/transaction-status'
import { isInstallmentGroup } from '@/features/transactions/utils/installment'
import type { Transaction } from '@/features/transactions/types'

export interface TransactionActionHandlers {
  onEdit: (t: Transaction) => void
  onDelete: (t: Transaction) => void
  onPay: (t: Transaction) => void
  onCancel: (t: Transaction) => void
  onReactivate: (t: Transaction) => void
  onView: (t: Transaction) => void
  /** Abre a série de parcelamento — usado no lugar das ações por parcela. */
  onViewSeries?: (t: Transaction) => void
}

interface TransactionActionsProps extends TransactionActionHandlers {
  transaction: Transaction
}

/**
 * Ações de uma transação na lista: "Pagar" fica à vista (é a ação do dia a dia); editar,
 * cancelar/reativar e excluir ficam no menu "…" para a linha não ocupar meia tabela.
 */
export function TransactionActions({
  transaction,
  onEdit,
  onDelete,
  onPay,
  onCancel,
  onReactivate,
  onView,
  onViewSeries,
}: TransactionActionsProps) {
  // Numa linha de série, pagar/editar/excluir valem para a série inteira e vivem
  // na tela de Parcelamentos — a API recusa essas operações parcela a parcela.
  if (isInstallmentGroup(transaction)) {
    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => (onViewSeries ? onViewSeries(transaction) : onView(transaction))}
      >
        Ver parcelas
      </Button>
    )
  }

  const isCancelled = transaction.status === 'CANCELLED'
  const isLocked = isLockedTransaction(transaction)
  const items: ActionMenuItem[] = []
  if (!isCancelled && !isLocked) {
    items.push({ label: 'Editar', onSelect: () => onEdit(transaction) })
    items.push({ label: 'Cancelar transação', onSelect: () => onCancel(transaction) })
  }
  if (canReactivateTransaction(transaction)) {
    items.push({ label: 'Reativar', onSelect: () => onReactivate(transaction) })
  }
  items.push({ label: 'Excluir', onSelect: () => onDelete(transaction), danger: true })

  return (
    <>
      {canPayTransaction(transaction) && (
        <Button type="button" size="sm" variant="ghost" onClick={() => onPay(transaction)}>
          Pagar
        </Button>
      )}
      <ActionMenu items={items} label={`Ações de ${transaction.description}`} />
    </>
  )
}
