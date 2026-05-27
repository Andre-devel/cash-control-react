import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { useArchiveAccount } from '@/features/accounts/hooks/use-archive-account'
import type { Account } from '@/features/accounts/types'

interface ArchiveAccountDialogProps {
  account: Account | null
  open: boolean
  onClose: () => void
}

export function ArchiveAccountDialog({ account, open, onClose }: ArchiveAccountDialogProps) {
  const { mutate: archiveAccount, isPending } = useArchiveAccount()

  function handleConfirm() {
    if (!account) return
    archiveAccount(account.id, {
      onSuccess: () => {
        onClose()
      },
    })
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive Account</DialogTitle>
          <DialogDescription>
            Archive <span className="font-semibold">{account?.name}</span>? The account will be
            hidden from the default view but its history will be preserved.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={isPending} aria-busy={isPending} onClick={handleConfirm}>
            {isPending ? (
              <>
                <span
                  className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                Archiving…
              </>
            ) : (
              'Archive Account'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
