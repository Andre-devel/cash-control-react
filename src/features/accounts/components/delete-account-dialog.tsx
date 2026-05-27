import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { useDeleteAccount } from '@/features/accounts/hooks/use-delete-account'
import type { Account } from '@/features/accounts/types'

interface DeleteAccountDialogProps {
  account: Account | null
  open: boolean
  onClose: () => void
}

export function DeleteAccountDialog({ account, open, onClose }: DeleteAccountDialogProps) {
  const { mutate: deleteAccount, isPending } = useDeleteAccount()
  const [conflictError, setConflictError] = useState<string | null>(null)

  function handleConfirm() {
    if (!account) return
    setConflictError(null)
    deleteAccount(account.id, {
      onSuccess: () => {
        onClose()
      },
      onError: (error) => {
        if (error.status === 409) {
          setConflictError(
            'This account cannot be deleted because it has linked transactions. Archive it instead to keep the history.',
          )
        }
      },
    })
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setConflictError(null)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete{' '}
            <span className="font-semibold">{account?.name}</span>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {conflictError && (
          <div
            className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {conflictError}
          </div>
        )}

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
              'Delete Account'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
