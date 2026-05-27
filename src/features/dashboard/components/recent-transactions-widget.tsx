import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRecentTransactions } from '@/features/dashboard/hooks/use-recent-transactions'
import { ROUTES } from '@/app/router/routes'

const TYPE_LABELS: Record<string, string> = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
  REFUND: 'Refund',
  ADJUSTMENT: 'Adjustment',
  TRANSFER: 'Transfer',
}

const STATUS_CLASSES: Record<string, string> = {
  PAID: 'text-green-600 dark:text-green-400',
  PENDING: 'text-yellow-600 dark:text-yellow-400',
  CANCELLED: 'text-muted-foreground line-through',
}

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
    <div
      className="space-y-2 animate-pulse"
      aria-busy="true"
      aria-label="Loading recent transactions"
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-10 rounded bg-muted" />
      ))}
    </div>
  )
}

export function RecentTransactionsWidget() {
  const { data, isLoading, isError, refetch } = useRecentTransactions(10)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <WidgetSkeleton />
        ) : isError ? (
          <div role="alert" className="space-y-2">
            <p className="text-sm text-destructive">Failed to load recent transactions.</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : !data || data.transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent transactions.</p>
        ) : (
          <ul className="divide-y" role="list">
            {data.transactions.map((tx) => {
              const isExpense = tx.type === 'EXPENSE'
              const amountClass = isExpense
                ? 'text-destructive'
                : 'text-green-600 dark:text-green-400'
              const statusClass = STATUS_CLASSES[tx.status] ?? ''

              return (
                <li key={tx.id} className="py-2 text-sm">
                  <Link
                    to={ROUTES.TRANSACTION_DETAIL.replace(':id', tx.id)}
                    className="flex items-center justify-between hover:underline focus:outline-none focus:underline"
                    aria-label={`${tx.description}: ${fmt(tx.amount)}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`truncate font-medium ${statusClass}`}>{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {TYPE_LABELS[tx.type] ?? tx.type} · {new Date(tx.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`font-mono font-semibold ml-4 ${amountClass}`}>
                      {isExpense ? '-' : '+'}
                      {fmt(tx.amount)}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
