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
            'Esta conta não pode ser excluída pois possui transações vinculadas. Arquive-a para preservar o histórico.',
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
      title="Excluir conta"
      onClose={handleClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
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
                Excluindo…
              </>
            ) : (
              'Excluir conta'
            )}
          </Button>
        </>
      }
    >
      <p>
        Tem certeza que deseja excluir permanentemente <strong>{account?.name}</strong>? Esta ação
        não pode ser desfeita.
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
