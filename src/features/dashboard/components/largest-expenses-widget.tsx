import { Link } from 'react-router-dom'
import { useLargestExpenses } from '@/features/dashboard/hooks/use-largest-expenses'
import { useHideValues } from '@/features/dashboard/hooks/use-hide-values'
import { ROUTES } from '@/app/router/routes'
import { formatLocalDate } from '@/lib/format-date'
import { Amount } from './amount'
import { Panel, PanelHeader, SkeletonBlock, WidgetEmpty, WidgetError } from './panel'

export function LargestExpensesWidget({ className = '' }: { className?: string }) {
  const { data, isLoading, isError, refetch } = useLargestExpenses(5)
  const { hidden } = useHideValues()
  const items = data ?? []
  const max = Math.max(1, ...items.map((e) => parseFloat(e.amount)))

  return (
    <Panel className={className} label="Maiores despesas">
      <PanelHeader title="Maiores despesas" />
      {isLoading ? (
        <div
          className="flex flex-col gap-3"
          aria-busy="true"
          aria-label="Carregando maiores despesas"
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonBlock key={i} className="h-9" />
          ))}
        </div>
      ) : isError ? (
        <WidgetError message="Falha ao carregar maiores despesas." onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <WidgetEmpty>Nenhuma despesa encontrada.</WidgetEmpty>
      ) : (
        <ol className="flex flex-col gap-1">
          {items.map((expense, i) => {
            const value = parseFloat(expense.amount)
            return (
              <li key={expense.id}>
                <Link
                  to={ROUTES.TRANSACTION_DETAIL.replace(':id', expense.id)}
                  className="flex min-h-touch flex-col justify-center gap-1.5 rounded-md py-1.5 text-fg no-underline hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
                  aria-label={
                    hidden ? expense.description : `${expense.description}: ${expense.amount}`
                  }
                >
                  <span className="flex items-center gap-2 text-body-sm">
                    <span className="w-6 flex-none font-mono text-caption font-semibold text-fg-muted">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{expense.description}</span>
                      <span className="block truncate text-caption text-fg-muted">
                        {expense.categoryName ?? 'Sem categoria'} ·{' '}
                        {formatLocalDate(expense.paymentDate)}
                      </span>
                    </span>
                    <Amount value={-value} className="font-semibold" />
                  </span>
                  <span
                    className="ml-8 h-[5px] rounded-xs bg-expense"
                    style={{ width: `calc((100% - 2rem) * ${value / max})` }}
                    aria-hidden="true"
                  />
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </Panel>
  )
}
