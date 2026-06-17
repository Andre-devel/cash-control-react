import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TypeBadge } from '@/components/ui/type-badge'
import { Money } from '@/components/ui/money'
import type { Recurrence } from '@/features/recurrences/types'

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Biweekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString()
}

interface RecurrenceCardProps {
  recurrence: Recurrence
  onEdit: (recurrence: Recurrence) => void
  onDelete: (recurrence: Recurrence) => void
  onPause: (recurrence: Recurrence) => void
  onResume: (recurrence: Recurrence) => void
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
              {recurrence.description}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
              <TypeBadge type={recurrence.type} />
              <span className="text-dim text-xs">·</span>
              <span className="text-dim text-xs">
                {FREQUENCY_LABELS[recurrence.frequency] ?? recurrence.frequency}
              </span>
              <Badge kind={isPaused ? 'pending' : 'paid'} dot={false} square>
                {isPaused ? 'Paused' : 'Active'}
              </Badge>
            </div>
          </div>
          <div className="mono fw-600 text-sm" style={{ flexShrink: 0 }}>
            <Money value={parseFloat(recurrence.amount)} />
          </div>
        </div>

        <p className="text-xs text-dim">
          Próxima execução: {formatDate(recurrence.nextOccurrenceDate)}
        </p>

        {isPaused && recurrence.resumeAt && (
          <p className="text-xs text-dim">
            Pausado até:{' '}
            <span className="fw-500">{new Date(recurrence.resumeAt).toLocaleDateString()}</span>
          </p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(recurrence)}
            aria-label={`Edit ${recurrence.description}`}
          >
            Editar
          </Button>
          {isPaused ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onResume(recurrence)}
              aria-label={`Resume ${recurrence.description}`}
            >
              Retomar
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPause(recurrence)}
              aria-label={`Pause ${recurrence.description}`}
            >
              Pausar
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(recurrence)}
            aria-label={`Delete ${recurrence.description}`}
          >
            Excluir
          </Button>
        </div>
      </div>
    </div>
  )
}
