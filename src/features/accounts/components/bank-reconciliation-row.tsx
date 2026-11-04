import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Money } from '@/components/ui/money'
import {
  useAccountReconciliation,
  useReconcileAccount,
} from '@/features/accounts/hooks/use-account-reconciliation'
import { formatTimeAgo } from '@/lib/format-date'

interface BankReconciliationRowProps {
  accountId: string
  currencyCode?: string
}

/**
 * Saldo do app conferido com o último saldo lido do banco. Some quando a conta não tem saldo
 * do banco (não vinculada ou ainda não lida). Com diferença, "Ajustar" confirma numa folha e
 * lança um único ajuste flutuante pela diferença — nada entra sem o clique do usuário.
 */
export function BankReconciliationRow({
  accountId,
  currencyCode = 'BRL',
}: BankReconciliationRowProps) {
  const { data } = useAccountReconciliation(accountId)
  const { mutate: reconcile, isPending } = useReconcileAccount()
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!data || data.bankBalance === null) return null

  const difference = Number(data.difference ?? 0)

  if (difference === 0) {
    return (
      <p className="m-0 flex items-center gap-1.5 text-caption text-income">
        <CheckCircle2 size={14} aria-hidden="true" />
        Confere com o banco · {formatTimeAgo(data.bankBalanceAt)}
      </p>
    )
  }

  function handleConfirm() {
    reconcile(accountId, { onSuccess: () => setConfirmOpen(false) })
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="m-0 text-caption text-fg-muted tabular-nums">
        Banco: <Money value={Number(data.bankBalance)} currency={currencyCode} /> · App:{' '}
        <Money value={Number(data.appBalance)} currency={currencyCode} /> · diferença{' '}
        <Money
          value={difference}
          currency={currencyCode}
          signed
          className={difference < 0 ? 'text-expense' : 'text-income'}
        />
      </p>
      <Button size="sm" onClick={() => setConfirmOpen(true)}>
        Ajustar
      </Button>

      {confirmOpen && (
        <Modal
          title="Ajustar com o banco"
          onClose={() => setConfirmOpen(false)}
          footer={
            <>
              <Button type="button" variant="ghost" onClick={() => setConfirmOpen(false)}>
                Cancelar
              </Button>
              <div className="spacer" />
              <Button variant="primary" loading={isPending} onClick={handleConfirm}>
                {isPending ? 'Ajustando…' : 'Confirmar ajuste'}
              </Button>
            </>
          }
        >
          <p className="m-0 text-body-sm">
            Cria um ajuste de <Money value={difference} currency={currencyCode} signed /> para a
            conta bater com o banco.
          </p>
        </Modal>
      )}
    </div>
  )
}
