import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useCancelTransaction } from '@/features/transactions/hooks/use-cancel-transaction'
import type { Transaction } from '@/features/transactions/types'

interface CancelTransactionDialogProps {
  transaction: Transaction | null
  open: boolean
  onClose: () => void
}

export function CancelTransactionDialog({
  transaction,
  open,
  onClose,
}: CancelTransactionDialogProps) {
  const { mutate: cancelTransaction, isPending } = useCancelTransaction()

  function handleConfirm() {
    if (!transaction) return
    cancelTransaction(transaction.id, {
      onSuccess: () => {
        onClose()
      },
    })
  }

  if (!open) return null

  return (
    <Modal
      title="Cancelar transação"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Manter transação
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
                Cancelando…
              </>
            ) : (
              'Confirmar cancelamento'
            )}
          </Button>
        </>
      }
    >
      <p>
        Tem certeza que deseja cancelar <strong>{transaction?.description}</strong>? O registro será
        preservado mas removido dos cálculos de saldo.
      </p>
    </Modal>
  )
}
