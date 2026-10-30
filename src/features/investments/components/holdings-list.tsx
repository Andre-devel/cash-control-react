import { ActionMenu, type ActionMenuItem } from '@/components/ui/action-menu'
import { Badge } from '@/components/ui/badge'
import { Money } from '@/components/ui/money'
import type { FixedIncomeHolding } from '@/features/investments/types'
import {
  KIND_LABELS,
  formatPercent,
  rateLabel,
  toNumber,
} from '@/features/investments/utils/labels'
import { formatLocalDate } from '@/lib/format-date'

interface HoldingsListProps {
  holdings: FixedIncomeHolding[]
  onOpen: (holding: FixedIncomeHolding) => void
  onRedeem: (holding: FixedIncomeHolding) => void
  onEdit: (holding: FixedIncomeHolding) => void
  onManualValue: (holding: FixedIncomeHolding) => void
  onDelete: (holding: FixedIncomeHolding) => void
}

function maturityLabel(holding: FixedIncomeHolding): string {
  if (!holding.maturityDate) return 'Liquidez diária'
  const days = holding.daysToMaturity ?? 0
  if (holding.status === 'ACTIVE' && days >= 0 && days <= 30) {
    return `Vence ${formatLocalDate(holding.maturityDate)} (${days} ${days === 1 ? 'dia' : 'dias'})`
  }
  return `Vence ${formatLocalDate(holding.maturityDate)}`
}

export function HoldingsList({
  holdings,
  onOpen,
  onRedeem,
  onEdit,
  onManualValue,
  onDelete,
}: HoldingsListProps) {
  return (
    <ul className="m-0 flex list-none flex-col divide-y divide-border p-0">
      {holdings.map((holding) => {
        const valuation = holding.valuation
        const active = holding.status === 'ACTIVE'
        const items: ActionMenuItem[] = [
          ...(active ? [{ label: 'Resgatar', onSelect: () => onRedeem(holding) }] : []),
          { label: 'Editar', onSelect: () => onEdit(holding) },
          ...(active && holding.kind !== 'TESOURO_DIRETO'
            ? [{ label: 'Informar valor do banco', onSelect: () => onManualValue(holding) }]
            : []),
          ...(holding.redemptions.length === 0
            ? [{ label: 'Excluir', onSelect: () => onDelete(holding), danger: true }]
            : []),
        ]
        const yieldValue = valuation ? toNumber(valuation.yield) : 0
        return (
          <li key={holding.id} className="flex items-center gap-3 py-3">
            <button
              type="button"
              onClick={() => onOpen(holding)}
              className="flex min-w-0 flex-1 flex-col gap-1 rounded-md text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus md:flex-row md:items-center md:gap-4"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-semibold text-fg">{holding.name}</span>
                <span className="flex flex-wrap items-center gap-1.5 text-caption text-fg-muted">
                  {KIND_LABELS[holding.kind]} · {rateLabel(holding)} · {maturityLabel(holding)}
                  {holding.taxExempt && (
                    <Badge kind="info" dot={false}>
                      Isento
                    </Badge>
                  )}
                  {valuation?.estimated && (
                    <Badge kind="pending" dot={false}>
                      Estimado
                    </Badge>
                  )}
                  {holding.manualValue !== null && active && (
                    <Badge kind="muted" dot={false}>
                      Valor do banco
                    </Badge>
                  )}
                  {!active && (
                    <Badge kind="muted" dot={false}>
                      Resgatada
                    </Badge>
                  )}
                </span>
              </span>
              {valuation ? (
                <span className="flex shrink-0 flex-col items-start tabular-nums md:items-end">
                  <span className="font-semibold text-fg">
                    <Money value={toNumber(valuation.gross)} />
                  </span>
                  <span
                    className={`text-caption ${yieldValue < 0 ? 'text-expense' : 'text-income'}`}
                  >
                    <Money value={yieldValue} signed /> ({formatPercent(holding.yieldPercent)})
                  </span>
                  <span className="text-caption text-fg-muted">
                    líquido <Money value={toNumber(valuation.net)} />
                  </span>
                </span>
              ) : (
                <span className="shrink-0 text-caption text-fg-muted">
                  aplicado <Money value={toNumber(holding.principal)} />
                </span>
              )}
            </button>
            <ActionMenu items={items} label={`Ações de ${holding.name}`} />
          </li>
        )
      })}
    </ul>
  )
}
