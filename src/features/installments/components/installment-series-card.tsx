import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { InstallmentSeries } from '@/features/installments/types'

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  SETTLED: 'Settled',
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  SETTLED: 'bg-muted text-muted-foreground',
}

const TYPE_LABELS: Record<string, string> = {
  EXPENSE: 'Expense',
  INCOME: 'Income',
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
    <div className="rounded-md border border-border p-4 space-y-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="space-y-0.5 min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{series.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">{TYPE_LABELS[series.type]}</span>
            <span className={cn('text-xs rounded-full px-2 py-0.5', STATUS_COLORS[series.status])}>
              {STATUS_LABELS[series.status]}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold tabular-nums">{series.totalAmount}</p>
          <p className="text-xs text-muted-foreground">
            {series.paidCount}/{series.installmentCount} paid
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Progress</span>
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={series.paidCount}
            aria-valuemin={0}
            aria-valuemax={series.installmentCount}
            aria-label={`${series.paidCount} of ${series.installmentCount} installments paid`}
          />
        </div>
      </div>

      {series.nextDueDate && (
        <p className="text-xs text-muted-foreground">
          Next due: <span className="font-medium">{series.nextDueDate}</span>
        </p>
      )}

      {series.status === 'ACTIVE' && (
        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-[44px] text-xs"
            onClick={() => onEditSeries(series)}
            aria-label={`Edit series: ${series.description}`}
          >
            Edit Series
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-[44px] text-xs"
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
                className="min-h-[44px] text-xs"
                onClick={() => onAdvance(series)}
                aria-label={`Advance installment: ${series.description}`}
              >
                Advance
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-[44px] text-xs text-destructive hover:text-destructive"
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
  )
}
