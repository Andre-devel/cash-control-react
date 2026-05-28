import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
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

  if (!open) return null

  return (
    <Modal
      title="Archive Account"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <div className="spacer" />
          <Button
            type="button"
            variant="primary"
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
                Archiving…
              </>
            ) : (
              'Archive Account'
            )}
          </Button>
        </>
      }
    >
      <p>
        Archive <strong>{account?.name}</strong>? The account will be hidden from the default view
        but its history will be preserved.
      </p>
    </Modal>
  )
}
