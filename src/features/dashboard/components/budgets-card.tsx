import { Link } from 'react-router-dom'
import { ROUTES } from '@/app/router/routes'
import { BudgetRow } from '@/features/budgets/components/budget-row'
import { useBudgetProgress } from '@/features/budgets/hooks/use-budgets'
import { pacePercent } from '@/features/budgets/utils/budget-tone'
import { Amount } from './amount'
import { Panel, PanelHeader, SkeletonBlock, WidgetError } from './panel'

/** Quantas categorias o card mostra; a API já manda as mais perto do teto primeiro. */
const PREVIEW = 4

interface BudgetsCardProps {
  /** Mês escolhido no topo do dashboard (`aaaa-mm`). */
  month: string
  className?: string
}

const LINK =
  'inline-flex min-h-touch items-center px-1 text-body-sm font-semibold text-brand-text no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus'

export function BudgetsCard({ month, className = '' }: BudgetsCardProps) {
  const { data, isLoading, isError, refetch } = useBudgetProgress(month)

  if (isLoading) {
    return (
      <Panel className={className} label="Orçamentos">
        <SkeletonBlock className="h-24" />
      </Panel>
    )
  }

  if (isError || !data) {
    return (
      <Panel className={className} label="Orçamentos">
        <PanelHeader title="Orçamentos" />
        <WidgetError
          message="Não foi possível carregar os orçamentos."
          onRetry={() => void refetch()}
        />
      </Panel>
    )
  }

  if (data.items.length === 0) {
    return (
      <Panel className={className} label="Orçamentos">
        <PanelHeader title="Orçamentos" />
        <p className="text-body-sm text-fg-muted">
          Defina um teto por categoria para ver aqui quanto já foi usado no mês.{' '}
          <Link to={ROUTES.BUDGETS} className={LINK}>
            Criar orçamento
          </Link>
        </p>
      </Panel>
    )
  }

  const pace = pacePercent(data.dayOfMonth, data.daysInMonth)

  return (
    <Panel className={className} label="Orçamentos">
      <PanelHeader
        title="Orçamentos"
        sub={
          <>
            <Amount value={data.totalSpent} /> de <Amount value={data.totalBudget} /> no mês
          </>
        }
        right={
          <Link to={ROUTES.BUDGETS} className={LINK}>
            Ver orçamentos
          </Link>
        }
      />
      <ul className="grid gap-x-6 md:grid-cols-2 xl:grid-cols-4">
        {data.items.slice(0, PREVIEW).map((item) => (
          <li key={item.categoryId}>
            <BudgetRow item={item} pace={pace} compact />
          </li>
        ))}
      </ul>
    </Panel>
  )
}
