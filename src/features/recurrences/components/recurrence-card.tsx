import { Button } from '@/components/ui/button'
import type { Recurrence } from '@/features/recurrences/types'

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Biweekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
}

const TYPE_LABELS: Record<string, string> = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
  REFUND: 'Refund',
  ADJUSTMENT: 'Adjustment',
}

interface RecurrenceCardProps {
  recurrence: Recurrence
  onEdit: (recurrence: Recurrence) => void
  onDelete: (recurrence: Recurrence) => void
  onPause: (recurrence: Recurrence) => void
  onResume: (recurrence: Recurrence) => void
}

function formatAmount(amount: string): string {
  const num = parseFloat(amount)
  if (isNaN(num)) return amount
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString()
}

export function RecurrenceCard({
  recurrence,
  onEdit,
  onDelete,
  onPause,
  onResume,
}: RecurrenceCardProps) {
  const isPaused = recurrence.status === 'PAUSED'

  return (
    <div className="card">
      <div className="card-b" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="fw-500 truncate">{recurrence.description}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-dim text-xs">
                {TYPE_LABELS[recurrence.type] ?? recurrence.type}
              </span>
              <span className="text-dim text-xs">·</span>
              <span className="text-dim text-xs">
                {FREQUENCY_LABELS[recurrence.frequency] ?? recurrence.frequency}
              </span>
              <span
                className={`badge ${isPaused ? 'pending' : 'paid'}`}
                aria-label={`Status: ${isPaused ? 'Paused' : 'Active'}`}
              >
                <span className="dot" />
                {isPaused ? 'Paused' : 'Active'}
              </span>
            </div>
          </div>
          <p className="mono fw-600 text-sm shrink-0">{formatAmount(recurrence.amount)}</p>
        </div>

        <p className="text-xs text-dim">
          Next execution: {formatDate(recurrence.nextExecutionDate)}
        </p>

        <div className="flex flex-wrap gap-1">
          <Button
            variant="outline"
            size="sm"
            className="text-xs min-h-[44px]"
            onClick={() => onEdit(recurrence)}
            aria-label={`Edit ${recurrence.description}`}
          >
            Edit
          </Button>
          {isPaused ? (
            <Button
              variant="outline"
              size="sm"
              className="text-xs min-h-[44px]"
              onClick={() => onResume(recurrence)}
              aria-label={`Resume ${recurrence.description}`}
            >
              Resume
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-xs min-h-[44px]"
              onClick={() => onPause(recurrence)}
              aria-label={`Pause ${recurrence.description}`}
            >
              Pause
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            className="text-xs min-h-[44px]"
            onClick={() => onDelete(recurrence)}
            aria-label={`Delete ${recurrence.description}`}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
