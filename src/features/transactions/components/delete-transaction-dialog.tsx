import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
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

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Transaction</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete{' '}
            <span className="font-semibold">{transaction?.description}</span>? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            aria-busy={isPending}
            onClick={handleConfirm}
          >
            {isPending ? (
              <>
                <span
                  className="w-4 h-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                Deleting…
              </>
            ) : (
              'Delete Transaction'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
