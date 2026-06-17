import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Money } from '@/components/ui/money'
import type { InstallmentSeries } from '@/features/installments/types'

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
  const isSettled = series.settled

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
              <Badge kind={isSettled ? 'muted' : 'paid'} dot={false} square>
                {isSettled ? 'Settled' : 'Active'}
              </Badge>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div className="text-lg mono fw-500">
              <Money value={parseFloat(series.totalAmount)} />
            </div>
            <div className="text-xs text-dim">{series.totalInstallments}x</div>
          </div>
        </div>

        <div
          className="bar"
          role="progressbar"
          aria-valuenow={isSettled ? 100 : 0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${series.description} — ${isSettled ? 'settled' : 'active'}`}
        >
          <i style={{ width: isSettled ? '100%' : '0%', background: 'var(--accent)' }} />
        </div>

        {series.firstPaymentDate && (
          <p className="text-xs text-dim">
            Início: <span className="fw-500">{series.firstPaymentDate}</span>
          </p>
        )}

        {!isSettled && (
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
          </div>
        )}
      </div>
    </div>
  )
}
