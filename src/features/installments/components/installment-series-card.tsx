import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

function seriesStatus(series: InstallmentSeries): { label: string; kind: 'muted' | 'paid' } {
  if (series.settled) return { label: 'Liquidada', kind: 'muted' }
  if (series.completed) return { label: 'Concluída', kind: 'muted' }
  return { label: 'Ativa', kind: 'paid' }
}

export function InstallmentSeriesCard({
  series,
  onEditSeries,
  onEditInstallment,
  onSettle,
  onAdvance,
  onDelete,
}: InstallmentSeriesCardProps) {
  const status = seriesStatus(series)
  const isOpen = !series.settled && !series.completed
  const progress = series.settled
    ? 100
    : Math.round((series.paidInstallments / series.totalInstallments) * 100)
  const total = parseFloat(series.totalAmount)

  return (
    <div className="card">
      <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 8,
            alignItems: 'flex-start',
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <p className="fw-500 truncate" style={{ marginBottom: 6 }}>
              {series.description}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Badge kind={status.kind} dot={false} square>
                {status.label}
              </Badge>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div className="text-lg mono fw-500">
              <Money value={total} />
            </div>
            <div className="text-xs text-dim">
              {series.totalInstallments}x de <Money value={total / series.totalInstallments} />
            </div>
          </div>
        </div>

        <div
          className="bar"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${series.description} — ${series.paidInstallments} de ${series.totalInstallments} parcelas pagas`}
        >
          <i style={{ width: `${progress}%`, background: 'var(--accent)' }} />
        </div>

        <div
          className="text-xs text-dim"
          style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <span>
            <span className="fw-500">
              {series.paidInstallments} de {series.totalInstallments}
            </span>{' '}
            pagas
            {isOpen && (
              <>
                {' · '}restam <Money value={parseFloat(series.remainingAmount)} />
              </>
            )}
          </span>
          {isOpen && series.nextDueDate && (
            <span>
              Próxima parcela: <span className="fw-500">{formatLocalDate(series.nextDueDate)}</span>
            </span>
          )}
          {series.firstPaymentDate && (
            <span>
              Início: <span className="fw-500">{formatLocalDate(series.firstPaymentDate)}</span>
            </span>
          )}
        </div>

        {isOpen && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEditSeries(series)}
              aria-label={`Editar série: ${series.description}`}
            >
              Editar série
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEditInstallment(series)}
              aria-label={`Editar parcela: ${series.description}`}
            >
              Editar parcela
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onAdvance(series)}
              aria-label={`Antecipar parcelas: ${series.description}`}
            >
              Antecipar
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => onSettle(series)}
              aria-label={`Liquidar antecipadamente: ${series.description}`}
            >
              Liquidar
            </Button>
            {series.paidInstallments === 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(series)}
                aria-label={`Excluir parcelamento: ${series.description}`}
              >
                Excluir
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
