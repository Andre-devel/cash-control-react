import { Link } from 'react-router-dom'
import { ROUTES } from '@/app/router/routes'
import { Badge } from '@/components/ui/badge'
import { useSubscriptions } from '@/features/dashboard/hooks/use-subscriptions'
import { Amount } from './amount'
import { Panel, PanelHeader, SkeletonBlock, WidgetError } from './panel'

const LINK =
  'inline-flex min-h-touch items-center px-1 text-body-sm font-semibold text-brand-text no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus'

interface SubscriptionsCardProps {
  className?: string
}

/**
 * Assinaturas: recorrências mensais de despesa ativas mais as sugestões não recusadas, com o
 * total por mês (somado pela API).
 */
export function SubscriptionsCard({ className = '' }: SubscriptionsCardProps) {
  const { data, isLoading, isError, refetch } = useSubscriptions()

  if (isLoading) {
    return (
      <Panel className={className} label="Assinaturas">
        <SkeletonBlock className="h-24" />
      </Panel>
    )
  }

  if (isError || !data) {
    return (
      <Panel className={className} label="Assinaturas">
        <PanelHeader title="Assinaturas" />
        <WidgetError
          message="Não foi possível carregar as assinaturas."
          onRetry={() => void refetch()}
        />
      </Panel>
    )
  }

  const link = (
    <Link to={ROUTES.RECURRENCES} className={LINK}>
      Ver recorrências
    </Link>
  )

  if (data.items.length === 0) {
    return (
      <Panel className={className} label="Assinaturas">
        <PanelHeader title="Assinaturas" right={link} />
        <p className="text-body-sm text-fg-muted">
          Nenhuma assinatura mensal cadastrada ou detectada no histórico.
        </p>
      </Panel>
    )
  }

  return (
    <Panel className={className} label="Assinaturas">
      <PanelHeader
        title="Assinaturas"
        sub={
          <span data-testid="subscriptions-total">
            <Amount value={parseFloat(data.monthlyTotal)} />
            /mês
          </span>
        }
        right={link}
      />
      <ul className="flex flex-col divide-y divide-border">
        {data.items.map((item, index) => (
          <li
            key={`${item.source}-${item.description}-${index}`}
            className="flex min-h-touch items-center gap-3 py-2"
          >
            <span className="min-w-0 flex-1 truncate text-body-sm text-fg">{item.description}</span>
            {item.source === 'SUGGESTION' && (
              <Badge kind="muted" dot={false}>
                detectada
              </Badge>
            )}
            <Amount value={parseFloat(item.amount)} className="text-body-sm text-fg" />
          </li>
        ))}
      </ul>
    </Panel>
  )
}
