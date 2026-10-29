import type { ReactNode } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  CircleSlash,
  PauseCircle,
  Pencil,
  Play,
  Pause,
  Repeat,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/ui/money'
import type { Recurrence } from '@/features/recurrences/types'
import { formatLocalDate } from '@/lib/format-date'

import { FREQUENCY_LABELS } from '@/features/recurrences/schemas/create-recurrence.schema'

const STATUS_BADGES: Record<
  Recurrence['status'],
  { label: string; kind: 'pending' | 'paid' | 'muted'; icon: ReactNode }
> = {
  ACTIVE: { label: 'Ativa', kind: 'paid', icon: <CheckCircle2 size={12} /> },
  PAUSED: { label: 'Pausada', kind: 'pending', icon: <PauseCircle size={12} /> },
  ENDED: { label: 'Encerrada', kind: 'muted', icon: <CircleSlash size={12} /> },
  DELETED: { label: 'Excluída', kind: 'muted', icon: <CircleSlash size={12} /> },
}

const TYPE_DISPLAY: Record<
  Recurrence['type'],
  { label: string; icon: ReactNode; bubble: string; amount: string; sign: 1 | -1 }
> = {
  EXPENSE: {
    label: 'Despesa',
    icon: <ArrowUpRight size={18} />,
    bubble: 'bg-expense-soft text-expense',
    amount: 'text-fg',
    sign: -1,
  },
  INCOME: {
    label: 'Receita',
    icon: <ArrowDownLeft size={18} />,
    bubble: 'bg-income-soft text-income',
    amount: 'text-income',
    sign: 1,
  },
  REFUND: {
    label: 'Estorno',
    icon: <RotateCcw size={18} />,
    bubble: 'bg-info-soft text-info',
    amount: 'text-income',
    sign: 1,
  },
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
  const badge = STATUS_BADGES[recurrence.status]
  const type = TYPE_DISPLAY[recurrence.type] ?? TYPE_DISPLAY.EXPENSE
  const titleId = `recurrence-${recurrence.id}-title`
  const origin = [recurrence.categoryName, recurrence.creditCardName ?? recurrence.accountName]
    .filter(Boolean)
    .join(' · ')

  return (
    <article
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface-1 p-4 shadow-1"
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${type.bubble}`}
          role="img"
          aria-label={type.label}
        >
          {type.icon}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 id={titleId} className="truncate text-body font-semibold text-fg">
            {recurrence.description}
          </h3>
          {origin && <span className="truncate text-caption text-fg-muted">{origin}</span>}
          <span className="mt-1">
            <Badge kind={badge.kind} icon={badge.icon} square>
              {badge.label}
            </Badge>
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`text-body font-bold tabular-nums ${type.amount}`}>
            <Money value={type.sign * parseFloat(recurrence.amount)} signed />
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-caption text-fg-muted">
            <Repeat size={12} aria-hidden="true" />
            <span>{FREQUENCY_LABELS[recurrence.frequency] ?? recurrence.frequency}</span>
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border pt-2.5 text-caption text-fg-muted">
        <span>
          {recurrence.endDate ? (
            <>
              até <span>{formatLocalDate(recurrence.endDate)}</span>
            </>
          ) : (
            <>desde {formatLocalDate(recurrence.startDate)} · sem fim</>
          )}
        </span>
        {isPaused ? (
          recurrence.resumeAt && (
            <span>
              Pausado até:{' '}
              <span className="font-semibold text-fg">{formatLocalDate(recurrence.resumeAt)}</span>
            </span>
          )
        ) : (
          <span>
            Próxima:{' '}
            <span className="font-semibold text-fg">
              {recurrence.nextDueDate ? formatLocalDate(recurrence.nextDueDate) : '—'}
            </span>
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="min-h-touch"
          leading={<Pencil size={14} />}
          onClick={() => onEdit(recurrence)}
          aria-label={`Editar ${recurrence.description}`}
        >
          Editar
        </Button>
        {isPaused ? (
          <Button
            variant="ghost"
            size="sm"
            className="min-h-touch"
            leading={<Play size={14} />}
            onClick={() => onResume(recurrence)}
            aria-label={`Retomar ${recurrence.description}`}
          >
            Retomar
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="min-h-touch"
            leading={<Pause size={14} />}
            onClick={() => onPause(recurrence)}
            aria-label={`Pausar ${recurrence.description}`}
          >
            Pausar
          </Button>
        )}
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className="min-h-touch text-overdue"
          leading={<Trash2 size={14} />}
          onClick={() => onDelete(recurrence)}
          aria-label={`Excluir ${recurrence.description}`}
        >
          Excluir
        </Button>
      </div>
    </article>
  )
}
