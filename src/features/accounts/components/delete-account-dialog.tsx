import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
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

  function handleClose() {
    setConflictError(null)
    onClose()
  }

  if (!open) return null

  return (
    <Modal
      title="Delete Account"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
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
              'Delete Account'
            )}
          </Button>
        </>
      }
    >
      <p>
        Are you sure you want to permanently delete <strong>{account?.name}</strong>? This action
        cannot be undone.
      </p>
      {conflictError && (
        <div
          className="rounded px-4 py-3 text-sm"
          style={{
            border: '1px solid var(--expense-soft)',
            background: 'var(--expense-soft)',
            color: 'var(--expense)',
            marginTop: 12,
          }}
          role="alert"
        >
          {conflictError}
        </div>
      )}
    </Modal>
  )
}
