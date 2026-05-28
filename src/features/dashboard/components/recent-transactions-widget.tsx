import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useRecentTransactions } from '@/features/dashboard/hooks/use-recent-transactions'
import { ROUTES } from '@/app/router/routes'

const TYPE_LABELS: Record<string, string> = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
  REFUND: 'Reembolso',
  TRANSFER: 'Transferência',
}

function WidgetSkeleton() {
  return (
    <div
      className="space-y-2 animate-pulse"
      aria-busy="true"
      aria-label="Loading recent transactions"
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-10 rounded" style={{ background: 'var(--surface-3)' }} />
      ))}
    </div>
  )
}

export function RecentTransactionsWidget() {
  const { data, isLoading, isError, refetch } = useRecentTransactions(10)

  return (
    <div className="card">
      <div className="card-h">
        <h3>Recent Transactions</h3>
      </div>
      <div className="card-b">
        {isLoading ? (
          <WidgetSkeleton />
        ) : isError ? (
          <div role="alert" className="space-y-2">
            <p className="text-sm" style={{ color: 'var(--expense)' }}>
              Failed to load recent transactions.
            </p>
            <Button variant="ghost" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-dim" style={{ textAlign: 'center', padding: '16px 0' }}>
            No recent transactions.
          </p>
        ) : (
          <ul className="divide-y" role="list">
            {data.map((tx) => {
              const isExpense = tx.type === 'EXPENSE'
              const isCancelled = tx.status === 'CANCELLED'
              const amountColor = isExpense ? 'var(--expense)' : 'var(--income)'
              const statusColor =
                tx.status === 'PAID'
                  ? 'var(--income)'
                  : tx.status === 'PENDING'
                    ? 'var(--pending)'
                    : 'var(--cancelled)'

              return (
                <li key={tx.id} className="py-2 text-sm">
                  <Link
                    to={ROUTES.TRANSACTION_DETAIL.replace(':id', tx.id)}
                    className="flex items-center justify-between hover:underline focus:outline-none focus:underline"
                    aria-label={`${tx.description}: ${tx.amount}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate fw-500${isCancelled ? ' line-through' : ''}`}
                        style={{ color: statusColor }}
                      >
                        {tx.description}
                      </p>
                      <p className="text-xs text-dim">
                        {TYPE_LABELS[tx.type] ?? tx.type} · {new Date(tx.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="mono fw-600 ml-4" style={{ color: amountColor }}>
                      {isExpense ? '-' : '+'}
                      {tx.amount}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
