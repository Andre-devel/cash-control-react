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
      title="Arquivar conta"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
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
                Arquivando…
              </>
            ) : (
              'Arquivar conta'
            )}
          </Button>
        </>
      }
    >
      <p>
        Arquivar <strong>{account?.name}</strong>? A conta será ocultada da visualização padrão, mas
        seu histórico será preservado.
      </p>
    </Modal>
  )
}
