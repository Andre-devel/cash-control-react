import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useLargestExpenses } from '@/features/dashboard/hooks/use-largest-expenses'
import { ROUTES } from '@/app/router/routes'

function WidgetSkeleton() {
  return (
    <div className="space-y-2 animate-pulse" aria-busy="true" aria-label="Loading largest expenses">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-10 rounded" style={{ background: 'var(--surface-3)' }} />
      ))}
    </div>
  )
}

export function LargestExpensesWidget() {
  const { data, isLoading, isError, refetch } = useLargestExpenses(5)

  return (
    <div className="card">
      <div className="card-h">
        <h3>Largest Expenses</h3>
      </div>
      <div className="card-b">
        {isLoading ? (
          <WidgetSkeleton />
        ) : isError ? (
          <div role="alert" className="space-y-2">
            <p className="text-sm" style={{ color: 'var(--expense)' }}>
              Failed to load largest expenses.
            </p>
            <Button variant="ghost" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : !data || data.expenses.length === 0 ? (
          <p className="text-sm text-dim" style={{ textAlign: 'center', padding: '16px 0' }}>
            No expenses found.
          </p>
        ) : (
          <ul className="divide-y" role="list">
            {data.expenses.map((expense) => (
              <li key={expense.id} className="py-2 text-sm">
                <Link
                  to={ROUTES.TRANSACTION_DETAIL.replace(':id', expense.id)}
                  className="flex items-center justify-between hover:underline focus:outline-none focus:underline"
                  aria-label={`${expense.description}: ${expense.amount}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate fw-500">{expense.description}</p>
                    <p className="text-xs text-dim">
                      {expense.categoryName ?? 'Uncategorized'} ·{' '}
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="mono fw-600 ml-4" style={{ color: 'var(--expense)' }}>
                    {expense.amount}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
