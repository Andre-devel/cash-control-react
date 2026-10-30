import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Money } from '@/components/ui/money'
import type { FixedIncomeHolding, PendingInvestmentTransfer } from '@/features/investments/types'
import { toNumber } from '@/features/investments/utils/labels'
import { formatLocalDate } from '@/lib/format-date'

interface PickHoldingDialogProps {
  transfer: PendingInvestmentTransfer | null
  /** Aplicações ativas; a lista fica só com as da conta do resgate. */
  holdings: FixedIncomeHolding[]
  onPick: (holding: FixedIncomeHolding) => void
  onClose: () => void
}

/** Primeiro passo de conciliar um resgate do extrato: de qual aplicação ele saiu. */
export function PickHoldingDialog({ transfer, holdings, onPick, onClose }: PickHoldingDialogProps) {
  if (!transfer) return null
  const candidates = holdings.filter(
    (holding) => holding.accountId === transfer.accountId && holding.status === 'ACTIVE',
  )

  return (
    <Modal
      title="Conciliar resgate"
      subtitle={`${formatLocalDate(transfer.date)} · ${transfer.description}`}
      onClose={onClose}
      footer={
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
      }
    >
      {candidates.length === 0 ? (
        <p className="text-body-sm text-fg">
          Nenhuma aplicação ativa em <strong>{transfer.accountName}</strong>. Registre primeiro a
          aplicação de onde o dinheiro saiu.
        </p>
      ) : (
        <div className="col gap-2">
          <p className="text-body-sm text-fg-muted">
            De qual aplicação saiu o resgate de <Money value={toNumber(transfer.amount)} />?
          </p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {candidates.map((holding) => (
              <li key={holding.id}>
                <button
                  type="button"
                  onClick={() => onPick(holding)}
                  className="flex min-h-touch w-full items-center gap-3 rounded-xl bg-surface-2 p-3 text-left text-body-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
                >
                  <span className="min-w-0 flex-1 truncate font-medium text-fg">
                    {holding.name}
                  </span>
                  <span className="tabular-nums text-fg-muted">
                    <Money value={toNumber(holding.valuation?.net ?? holding.remainingPrincipal)} />{' '}
                    líquido
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  )
}
