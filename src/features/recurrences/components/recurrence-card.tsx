import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground truncate">{recurrence.description}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {TYPE_LABELS[recurrence.type] ?? recurrence.type}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                {FREQUENCY_LABELS[recurrence.frequency] ?? recurrence.frequency}
              </span>
              <span
                className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                  isPaused
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                }`}
                aria-label={`Status: ${isPaused ? 'Paused' : 'Active'}`}
              >
                {isPaused ? 'Paused' : 'Active'}
              </span>
            </div>
          </div>
          <p className="font-mono font-semibold text-sm text-foreground shrink-0">
            {formatAmount(recurrence.amount)}
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          Next execution: {formatDate(recurrence.nextExecutionDate)}
        </p>

        <div className="flex flex-wrap gap-1">
          <Button
            variant="outline"
            size="sm"
            className="text-xs min-h-[36px]"
            onClick={() => onEdit(recurrence)}
          >
            Edit
          </Button>
          {isPaused ? (
            <Button
              variant="outline"
              size="sm"
              className="text-xs min-h-[36px]"
              onClick={() => onResume(recurrence)}
              aria-label="Resume recurrence"
            >
              Resume
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-xs min-h-[36px]"
              onClick={() => onPause(recurrence)}
              aria-label="Pause recurrence"
            >
              Pause
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-destructive hover:text-destructive min-h-[36px]"
            onClick={() => onDelete(recurrence)}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
