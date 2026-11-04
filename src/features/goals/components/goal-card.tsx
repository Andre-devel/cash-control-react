import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoryBubble } from '@/features/categories/components/category-bubble'
import { categoryColorCss } from '@/features/categories/utils/category-colors'
import { Amount } from '@/features/dashboard/components/amount'
import type { SavingsGoal } from '@/features/goals/types'
import { formatGoalMonth, goalRemaining } from '@/features/goals/utils/goal-format'

interface GoalCardProps {
  goal: SavingsGoal
  /** Nome da conta ou aplicação vinculada, quando houver. */
  linkLabel?: string
  /** Sem `onEdit`, o card é só leitura (dashboard). */
  onEdit?: (goal: SavingsGoal) => void
  onUnarchive?: (goal: SavingsGoal) => void
  /** Linha enxuta, sem borda, para o card do dashboard. */
  compact?: boolean
}

function GoalPlan({ goal }: { goal: SavingsGoal }) {
  const remaining = goalRemaining(goal)
  if (remaining === 0) {
    return <p className="font-medium text-income">Meta atingida</p>
  }
  return (
    <>
      <p>
        Faltam <Amount value={remaining} />
      </p>
      {goal.targetDate && goal.monthlyNeeded !== null ? (
        <p>
          Guardar <Amount value={goal.monthlyNeeded} /> por mês até{' '}
          {formatGoalMonth(goal.targetDate)}
        </p>
      ) : (
        <p>Sem prazo definido</p>
      )}
    </>
  )
}

/** Progresso de uma meta: barra na cor da meta, quanto falta e quanto guardar por mês. */
export function GoalCard({ goal, linkLabel, onEdit, onUnarchive, compact = false }: GoalCardProps) {
  const percent = Math.max(goal.percent, 0)
  const archived = goal.archivedAt !== null

  return (
    <article
      aria-label={goal.name}
      className={
        compact
          ? 'flex flex-col gap-2 py-2'
          : `flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface-1 p-4 ${archived ? 'opacity-70' : ''}`
      }
    >
      <div className="flex items-center gap-3">
        <CategoryBubble
          color={goal.color}
          icon={goal.icon ?? 'savings'}
          size={compact ? 'sm' : 'md'}
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-body font-semibold text-fg">{goal.name}</h3>
          {!compact && linkLabel && (
            <p className="truncate text-caption text-fg-muted">{linkLabel}</p>
          )}
        </div>
        <span className="text-body-sm font-semibold tabular-nums text-fg">
          {Math.round(percent)}%
        </span>
        {onEdit && !archived && (
          <button
            type="button"
            className="btn btn-icon btn-ghost min-h-touch min-w-touch"
            aria-label={`Editar ${goal.name}`}
            onClick={() => onEdit(goal)}
          >
            <Pencil size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      <div
        role="progressbar"
        aria-label={`Progresso de ${goal.name}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(Math.round(percent), 100)}
        className="relative h-2 w-full overflow-hidden rounded-full bg-surface-3"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${Math.min(percent, 100)}%`, background: categoryColorCss(goal.color) }}
        />
      </div>

      <div className="flex flex-col gap-0.5 text-caption text-fg-muted">
        <p>
          <Amount value={goal.current} className="font-semibold text-fg" /> de{' '}
          <Amount value={goal.targetAmount} />
        </p>
        {archived ? <p>Arquivada</p> : <GoalPlan goal={goal} />}
      </div>

      {archived && onUnarchive && (
        <Button size="sm" variant="ghost" className="self-start" onClick={() => onUnarchive(goal)}>
          Reativar
        </Button>
      )}
    </article>
  )
}
