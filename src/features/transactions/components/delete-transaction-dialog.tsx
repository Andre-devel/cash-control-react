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

  return (
    <Modal
      title="Delete Transaction"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
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
                Deleting…
              </>
            ) : (
              'Delete Transaction'
            )}
          </Button>
        </>
      }
    >
      <p>
        Are you sure you want to permanently delete <strong>{transaction?.description}</strong>?
        This action cannot be undone.
      </p>
    </Modal>
  )
}
