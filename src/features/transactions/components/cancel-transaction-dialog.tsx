import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
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

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Transaction</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel{' '}
            <span className="font-semibold">{transaction?.description}</span>? The record will be
            preserved but removed from balance calculations.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Keep Transaction
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
                Cancelling…
              </>
            ) : (
              'Cancel Transaction'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
