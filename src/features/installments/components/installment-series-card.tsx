import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TypeBadge } from '@/components/ui/type-badge'
import { Money } from '@/components/ui/money'
import type { InstallmentSeries } from '@/features/installments/types'

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  SETTLED: 'Settled',
}

const STATUS_KINDS: Record<string, 'paid' | 'muted'> = {
  ACTIVE: 'paid',
  SETTLED: 'muted',
}

interface InstallmentSeriesCardProps {
  series: InstallmentSeries
  onEditSeries: (s: InstallmentSeries) => void
  onEditInstallment: (s: InstallmentSeries) => void
  onSettle: (s: InstallmentSeries) => void
  onAdvance: (s: InstallmentSeries) => void
}

export function InstallmentSeriesCard({
  series,
  onEditSeries,
  onEditInstallment,
  onSettle,
  onAdvance,
}: InstallmentSeriesCardProps) {
  const remaining = series.installmentCount - series.paidCount
  const progress =
    series.installmentCount > 0 ? Math.round((series.paidCount / series.installmentCount) * 100) : 0

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
              <TypeBadge type={series.type} />
              <Badge kind={STATUS_KINDS[series.status] ?? 'muted'} dot={false} square>
                {STATUS_LABELS[series.status] ?? series.status}
              </Badge>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div className="text-lg mono fw-500">
              <Money value={parseFloat(series.totalAmount)} />
            </div>
            <div className="text-xs text-dim">
              {series.paidCount}/{series.installmentCount} paid
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span className="text-xs text-dim">Progresso</span>
            <span className="text-xs text-dim mono">{progress}%</span>
          </div>
          <div
            className="bar"
            role="progressbar"
            aria-valuenow={series.paidCount}
            aria-valuemin={0}
            aria-valuemax={series.installmentCount}
            aria-label={`${series.paidCount} of ${series.installmentCount} installments paid`}
          >
            <i style={{ width: `${progress}%`, background: 'var(--accent)' }} />
          </div>
        </div>

        {series.nextDueDate && (
          <p className="text-xs text-dim">
            Próximo vencimento: <span className="fw-500">{series.nextDueDate}</span>
          </p>
        )}

        {series.status === 'ACTIVE' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEditSeries(series)}
              aria-label={`Edit series: ${series.description}`}
            >
              Edit Series
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEditInstallment(series)}
              aria-label={`Edit Installment: ${series.description}`}
            >
              Edit Installment
            </Button>
            {remaining > 0 && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onAdvance(series)}
                  aria-label={`Advance installment: ${series.description}`}
                >
                  Advance
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => onSettle(series)}
                  aria-label={`Settle early: ${series.description}`}
                >
                  Settle Early
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
