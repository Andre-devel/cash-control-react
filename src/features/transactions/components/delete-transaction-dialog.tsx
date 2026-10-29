import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useDeleteTransaction } from '@/features/transactions/hooks/use-delete-transaction'
import type { Transaction } from '@/features/transactions/types'

interface DeleteTransactionDialogProps {
  transaction: Transaction | null
  open: boolean
  onClose: () => void
}

export function DeleteTransactionDialog({
  transaction,
  open,
  onClose,
}: DeleteTransactionDialogProps) {
  const { mutate: deleteTransaction, isPending } = useDeleteTransaction()

  function handleConfirm() {
    if (!transaction) return
    deleteTransaction(transaction.id, {
      onSuccess: () => {
        onClose()
      },
    })
  }

  if (!open) return null

  // Pagamento de fatura não some: excluir é estornar — o dinheiro volta e a fatura reabre.
  const isRefund = transaction?.type === 'INVOICE_PAYMENT'

  return (
    <Modal
      alert
      title={isRefund ? 'Estornar pagamento de fatura' : 'Excluir transação'}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="button"
            variant="danger"
            disabled={isPending}
            aria-busy={isPending}
            onClick={handleConfirm}
          >
            {isPending ? (
              <>
                <span
                  className="animate-spin"
                  style={{
                    width: 14,
                    height: 14,
                    border: '2px solid currentColor',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    display: 'inline-block',
                  }}
                  aria-hidden="true"
                />
                {isRefund ? 'Estornando…' : 'Excluindo…'}
              </>
            ) : isRefund ? (
              'Estornar pagamento'
            ) : (
              'Excluir transação'
            )}
          </Button>
        </>
      }
    >
      {isRefund ? (
        <p>
          Estornar <strong>{transaction?.description}</strong>? O valor volta para a conta e sai do
          pago da fatura, que reabre se ficar devendo.
        </p>
      ) : (
        <p>
          Tem certeza que deseja excluir permanentemente <strong>{transaction?.description}</strong>
          ? Esta ação não pode ser desfeita.
        </p>
      )}
    </Modal>
  )
}
