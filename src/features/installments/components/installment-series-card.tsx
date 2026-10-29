import type { ReactNode } from 'react'
import { CheckCircle2, CircleSlash, Layers } from 'lucide-react'
import { ActionMenu, type ActionMenuItem } from '@/components/ui/action-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/ui/money'
import type { InstallmentSeries } from '@/features/installments/types'
import { formatLocalDate } from '@/lib/format-date'

interface InstallmentSeriesCardProps {
  series: InstallmentSeries
  onEditSeries: (s: InstallmentSeries) => void
  onEditInstallment: (s: InstallmentSeries) => void
  onSettle: (s: InstallmentSeries) => void
  onAdvance: (s: InstallmentSeries) => void
  onDelete: (s: InstallmentSeries) => void
}

/** Acima disso a barra segmentada vira ruído: cai para uma barra contínua. */
const MAX_SEGMENTS = 24

function closedStatus(series: InstallmentSeries) {
  if (series.settled)
    return { label: 'Liquidada', kind: 'muted' as const, icon: <CircleSlash size={12} /> }
  if (series.completed)
    return { label: 'Concluída', kind: 'paid' as const, icon: <CheckCircle2 size={12} /> }
  return null
}

function ProgressBar({
  series,
  progress,
  isOpen,
}: {
  series: InstallmentSeries
  progress: number
  isOpen: boolean
}) {
  const total = series.totalInstallments
  const paid = series.settled ? total : series.paidInstallments
  const label = `${series.description} — ${series.paidInstallments} de ${total} parcelas pagas`

  return (
    <div
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      {total <= MAX_SEGMENTS ? (
        <div className="flex gap-[3px]" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`h-2 flex-1 rounded-xs ${
                i < paid ? 'bg-brand' : i === paid && isOpen ? 'bg-brand/40' : 'bg-surface-3'
              }`}
            />
          ))}
        </div>
      ) : (
        <div className="h-2 overflow-hidden rounded-xs bg-surface-3" aria-hidden="true">
          <div className="h-full rounded-xs bg-brand" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  )
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-caption text-fg-muted">{label}</span>
      <span className="text-body-sm font-semibold text-fg tabular-nums">{children}</span>
    </div>
  )
}

export function InstallmentSeriesCard({
  series,
  onEditSeries,
  onEditInstallment,
  onSettle,
  onAdvance,
  onDelete,
}: InstallmentSeriesCardProps) {
  const status = closedStatus(series)
  const isOpen = !series.settled && !series.completed
  const progress = series.settled
    ? 100
    : Math.round((series.paidInstallments / series.totalInstallments) * 100)
  const total = parseFloat(series.totalAmount)
  const origin = series.accountName ?? series.categoryName
  const titleId = `series-${series.id}-title`

  const menuItems: ActionMenuItem[] = isOpen
    ? [
        { label: 'Editar série', onSelect: () => onEditSeries(series) },
        { label: 'Editar parcela', onSelect: () => onEditInstallment(series) },
        ...(series.paidInstallments === 0
          ? [{ label: 'Excluir parcelamento', onSelect: () => onDelete(series), danger: true }]
          : []),
      ]
    : []

  return (
    <article
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface-1 p-4 shadow-1"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-soft text-brand-text"
        >
          <Layers size={18} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 id={titleId} className="truncate text-body font-semibold text-fg">
            {series.description}
          </h3>
          <span className="text-caption text-fg-muted">
            {origin && <>{origin} · </>}
            {series.totalInstallments}x de <Money value={total / series.totalInstallments} />
          </span>
          {status && (
            <span className="mt-1">
              <Badge kind={status.kind} icon={status.icon} square>
                {status.label}
              </Badge>
            </span>
          )}
        </div>
        <ActionMenu items={menuItems} label={`Ações da série: ${series.description}`} />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-body-sm font-medium">
          <span>
            {series.paidInstallments} de {series.totalInstallments} pagas
          </span>
          <span className="text-fg-muted tabular-nums">{progress}%</span>
        </div>
        <ProgressBar series={series} progress={progress} isOpen={isOpen} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Total">
          <Money value={total} />
        </Stat>
        {isOpen ? (
          <Stat label="Saldo devedor">
            <Money value={parseFloat(series.remainingAmount)} />
          </Stat>
        ) : (
          <Stat label="Início">
            {series.firstPaymentDate ? formatLocalDate(series.firstPaymentDate) : '—'}
          </Stat>
        )}
        {isOpen && series.nextDueDate ? (
          <Stat label="Próxima">
            <span>{formatLocalDate(series.nextDueDate)}</span>
            <span className="text-fg-muted">
              {' '}
              · {series.paidInstallments + 1}/{series.totalInstallments}
            </span>
          </Stat>
        ) : (
          <Stat label={series.settled ? 'Liquidada em' : 'Próxima'}>
            {series.settled && series.settledAt ? formatLocalDate(series.settledAt) : '—'}
          </Stat>
        )}
      </div>

      {isOpen && (
        <div className="flex gap-2">
          <Button
            type="button"
            className="min-h-touch flex-1 justify-center"
            onClick={() => onAdvance(series)}
            aria-label={`Antecipar parcelas: ${series.description}`}
          >
            Antecipar
          </Button>
          <Button
            type="button"
            className="min-h-touch flex-1 justify-center"
            onClick={() => onSettle(series)}
            aria-label={`Liquidar antecipadamente: ${series.description}`}
          >
            Liquidar
          </Button>
        </div>
      )}
    </article>
  )
}
