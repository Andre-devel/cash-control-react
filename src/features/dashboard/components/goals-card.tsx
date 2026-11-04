import { Link } from 'react-router-dom'
import { Goal } from 'lucide-react'
import { ROUTES } from '@/app/router/routes'
import { GoalCard } from '@/features/goals/components/goal-card'
import { useGoals } from '@/features/goals/hooks/use-goals'
import { Panel, PanelHeader, SkeletonBlock, WidgetError } from './panel'

/** Quantas metas o card mostra, na ordem da API (mais antigas primeiro). */
const PREVIEW = 3

const LINK =
  'inline-flex min-h-touch items-center px-1 text-body-sm font-semibold text-brand-text no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus'

/** Resumo das metas ativas ao lado dos investimentos; o detalhe fica em /metas. */
export function GoalsCard({ className = '' }: { className?: string }) {
  const { data, isLoading, isError, refetch } = useGoals()

  if (isLoading) {
    return (
      <Panel className={className} label="Metas">
        <SkeletonBlock className="h-24" />
      </Panel>
    )
  }

  if (isError || !data) {
    return (
      <Panel className={className} label="Metas">
        <PanelHeader title="Metas" />
        <WidgetError message="Não foi possível carregar as metas." onRetry={() => void refetch()} />
      </Panel>
    )
  }

  const active = data.filter((g) => !g.archivedAt)

  return (
    <Panel className={className} label="Metas">
      <PanelHeader
        title="Metas"
        sub={active.length > PREVIEW ? `${PREVIEW} de ${active.length} metas` : undefined}
        right={
          active.length > 0 && (
            <Link to={ROUTES.GOALS} className={LINK}>
              Ver metas
            </Link>
          )
        }
      />
      {active.length === 0 ? (
        <Link
          to={ROUTES.GOALS}
          className="flex min-h-[56px] items-center gap-3 rounded-xl border border-dashed border-border-strong px-4 py-2 text-fg no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
        >
          <Goal size={18} className="flex-none text-brand-text" aria-hidden="true" />
          <span className="flex-1 text-body-sm text-fg-muted">Defina quanto quer juntar</span>
          <span className="text-body-sm font-semibold text-brand-text">Criar meta</span>
        </Link>
      ) : (
        <ul className="col divide-y divide-border">
          {active.slice(0, PREVIEW).map((goal) => (
            <li key={goal.id}>
              <GoalCard goal={goal} compact />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
