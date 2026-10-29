import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useArchiveAccount } from '@/features/accounts/hooks/use-archive-account'
import type { Account } from '@/features/accounts/types'
import { formatMoney } from '@/lib/money'

interface ArchiveAccountDialogProps {
  account: Account | null
  open: boolean
  onClose: () => void
}

export function ArchiveAccountDialog({ account, open, onClose }: ArchiveAccountDialogProps) {
  const { mutate: archiveAccount, isPending } = useArchiveAccount()
  // Conta arquivada sai do patrimônio; a API recusa arquivar com saldo.
  const hasBalance = account !== null && Number(account.balance) !== 0

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
      alert
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
            loading={isPending}
            disabled={hasBalance}
            onClick={handleConfirm}
          >
            {isPending ? 'Arquivando…' : 'Arquivar conta'}
          </Button>
        </>
      }
    >
      {hasBalance ? (
        <p role="alert">
          <strong>{account?.name}</strong> tem saldo de{' '}
          <strong>{formatMoney(account?.balance ?? 0, account?.currencyCode)}</strong>. Conta
          arquivada sai do patrimônio, então zere o saldo antes: transfira para outra conta ou use
          &ldquo;Ajustar saldo&rdquo;.
        </p>
      ) : (
        <p>
          Arquivar <strong>{account?.name}</strong>? A conta será ocultada da visualização padrão e
          não poderá receber lançamentos, mas seu histórico será preservado.
        </p>
      )}
    </Modal>
  )
}
