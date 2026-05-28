import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useUpcomingInvoices } from '@/features/dashboard/hooks/use-upcoming-invoices'
import { ROUTES } from '@/app/router/routes'

function WidgetSkeleton() {
  return (
    <div
      className="space-y-2 animate-pulse"
      aria-busy="true"
      aria-label="Loading upcoming invoices"
    >
      {[1, 2].map((i) => (
        <div key={i} className="h-10 rounded" style={{ background: 'var(--surface-3)' }} />
      ))}
    </div>
  )
}

export function UpcomingInvoicesWidget() {
  const { data, isLoading, isError, refetch } = useUpcomingInvoices()

  return (
    <div className="card">
      <div className="card-h">
        <h3>Upcoming Invoices</h3>
      </div>
      <div className="card-b">
        {isLoading ? (
          <WidgetSkeleton />
        ) : isError ? (
          <div role="alert" className="space-y-2">
            <p className="text-sm" style={{ color: 'var(--expense)' }}>
              Failed to load upcoming invoices.
            </p>
            <Button variant="ghost" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : !data || data.invoices.length === 0 ? (
          <p className="text-sm text-dim" style={{ textAlign: 'center', padding: '16px 0' }}>
            No upcoming invoices.
          </p>
        ) : (
          <ul className="divide-y" role="list">
            {data.invoices.map((inv) => (
              <li key={`${inv.cardId}-${inv.referenceMonth}`} className="py-2 text-sm">
                <Link
                  to={ROUTES.CARD_DETAIL.replace(':id', inv.cardId)}
                  className="flex items-center justify-between hover:underline focus:outline-none focus:underline"
                  aria-label={`${inv.cardName} invoice for ${inv.referenceMonth}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate fw-500">{inv.cardName}</p>
                    <p className="text-xs text-dim">
                      {inv.referenceMonth} · Due: {new Date(inv.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="mono fw-600 ml-4">{inv.totalAmount}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
