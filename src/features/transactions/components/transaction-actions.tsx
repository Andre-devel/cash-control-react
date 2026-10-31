import { CircleCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ActionMenu, type ActionMenuItem } from '@/components/ui/action-menu'
import {
  canPayTransaction,
  canReactivateTransaction,
  canSetReimbursement,
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
  /** Abre o diálogo de reembolso da despesa. Sem ele, a ação não aparece. */
  onReimbursement?: (t: Transaction) => void
}

interface TransactionActionsProps extends TransactionActionHandlers {
  transaction: Transaction
  /**
   * Onde fica "marcar como paga". Na tabela (`inline`) é um botão na própria linha; no
   * card (`menu`) vai para o menu "…", já que o atalho no toque é deslizar o card.
   */
  payPlacement?: 'inline' | 'menu'
}

/**
 * Ações de uma transação na lista: "Pagar" fica à vista na tabela (é a ação do dia a dia);
 * editar, cancelar/reativar e excluir ficam no menu "…" para a linha não ocupar meia tabela.
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
  onReimbursement,
  payPlacement = 'inline',
}: TransactionActionsProps) {
  // Numa linha de série, pagar/editar/excluir valem para a série inteira e vivem
  // na tela de Parcelamentos — a API recusa essas operações parcela a parcela.
  if (isInstallmentGroup(transaction)) {
    const viewSeries = () => (onViewSeries ? onViewSeries(transaction) : onView(transaction))
    // No card do celular o botão de texto espremia descrição e valor; vai para o menu.
    if (payPlacement === 'menu') {
      return (
        <ActionMenu
          items={[{ label: 'Ver parcelas', onSelect: viewSeries }]}
          label={`Ações de ${transaction.description}`}
        />
      )
    }
    return (
      <Button type="button" size="sm" variant="ghost" className="min-h-touch" onClick={viewSeries}>
        Ver parcelas
      </Button>
    )
  }

  const isCancelled = transaction.status === 'CANCELLED'
  const isLocked = isLockedTransaction(transaction)
  const canPay = canPayTransaction(transaction)
  const items: ActionMenuItem[] = []
  if (canPay && payPlacement === 'menu') {
    items.push({ label: 'Marcar como paga', onSelect: () => onPay(transaction) })
  }
  if (!isCancelled && !isLocked) {
    items.push({ label: 'Editar', onSelect: () => onEdit(transaction) })
    items.push({ label: 'Cancelar transação', onSelect: () => onCancel(transaction) })
  }
  if (onReimbursement && canSetReimbursement(transaction)) {
    items.push({
      label: transaction.reimbursement?.reimbursable ? 'Reembolso…' : 'Marcar como reembolsável…',
      onSelect: () => onReimbursement(transaction),
    })
  }
  if (canReactivateTransaction(transaction)) {
    items.push({ label: 'Reativar', onSelect: () => onReactivate(transaction) })
  }
  items.push({ label: 'Excluir', onSelect: () => onDelete(transaction), danger: true })

  return (
    <>
      {canPay && payPlacement === 'inline' && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="tx-row-pay text-paid"
          leading={<CircleCheck size={14} aria-hidden="true" />}
          onClick={() => onPay(transaction)}
        >
          Pagar
        </Button>
      )}
      <ActionMenu items={items} label={`Ações de ${transaction.description}`} />
    </>
  )
}
