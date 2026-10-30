import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/ui/money'
import { Panel, PanelHeader } from '@/features/dashboard/components/panel'
import type { PendingInvestmentTransfer } from '@/features/investments/types'
import { toNumber } from '@/features/investments/utils/labels'
import { formatLocalDate } from '@/lib/format-date'

interface PendingTransfersProps {
  transfers: PendingInvestmentTransfer[]
  onRegister: (transfer: PendingInvestmentTransfer) => void
  onReconcile: (transfer: PendingInvestmentTransfer) => void
}

/**
 * Aplicações e resgates que chegaram como transferência (em geral pelo import do extrato) e
 * ainda não foram registrados aqui. Registrar vincula a transferência: nada se duplica.
 */
export function PendingTransfers({ transfers, onRegister, onReconcile }: PendingTransfersProps) {
  if (transfers.length === 0) return null

  return (
    <Panel label="Movimentos para registrar">
      <PanelHeader
        title="Movimentos para registrar"
        sub="Transferências dos últimos 90 dias com a conta de investimento, ainda sem aplicação ou resgate"
      />
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {transfers.map((transfer) => {
          const application = transfer.direction === 'APPLICATION'
          const Icon = application ? ArrowDownLeft : ArrowUpRight
          return (
            <li
              key={transfer.transferGroupId}
              className="flex flex-wrap items-center gap-3 rounded-xl bg-surface-2 p-3 text-body-sm"
            >
              <Icon
                size={16}
                className={`flex-none ${application ? 'text-income' : 'text-expense'}`}
                aria-hidden="true"
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-medium text-fg">{transfer.description}</span>
                <span className="text-caption text-fg-muted">
                  {application ? 'Aplicação' : 'Resgate'} · {formatLocalDate(transfer.date)} ·{' '}
                  {transfer.accountName}
                  {transfer.counterpartAccountName &&
                    (application
                      ? ` ← ${transfer.counterpartAccountName}`
                      : ` → ${transfer.counterpartAccountName}`)}
                </span>
              </span>
              <span className="font-semibold tabular-nums">
                <Money value={toNumber(transfer.amount)} />
              </span>
              <Button
                size="sm"
                onClick={() => (application ? onRegister(transfer) : onReconcile(transfer))}
              >
                {application ? 'Registrar aplicação' : 'Conciliar resgate'}
              </Button>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
