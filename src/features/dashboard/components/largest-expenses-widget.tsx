import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLargestExpenses } from '@/features/dashboard/hooks/use-largest-expenses'
import { ROUTES } from '@/app/router/routes'

function fmt(amount: string): string {
  const n = parseFloat(amount)
  if (isNaN(n)) return amount
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function WidgetSkeleton() {
  return (
    <div className="space-y-2 animate-pulse" aria-busy="true" aria-label="Loading largest expenses">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-10 rounded bg-muted" />
      ))}
    </div>
  )
}

export function LargestExpensesWidget() {
  const { data, isLoading, isError, refetch } = useLargestExpenses(5)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Largest Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <WidgetSkeleton />
        ) : isError ? (
          <div role="alert" className="space-y-2">
            <p className="text-sm text-destructive">Failed to load largest expenses.</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : !data || data.expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No expenses found.</p>
        ) : (
          <ul className="divide-y" role="list">
            {data.expenses.map((expense) => (
              <li key={expense.id} className="py-2 text-sm">
                <Link
                  to={ROUTES.TRANSACTION_DETAIL.replace(':id', expense.id)}
                  className="flex items-center justify-between hover:underline focus:outline-none focus:underline"
                  aria-label={`${expense.description}: ${fmt(expense.amount)}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{expense.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {expense.categoryName ?? 'Uncategorized'} ·{' '}
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-mono font-semibold ml-4 text-destructive">
                    {fmt(expense.amount)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
