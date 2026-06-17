import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useUpcomingInvoices } from '@/features/dashboard/hooks/use-upcoming-invoices'
import { ROUTES } from '@/app/router/routes'

function WidgetSkeleton() {
  return (
    <div
      className="space-y-2 animate-pulse"
      aria-busy="true"
      aria-label="Carregando faturas próximas"
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
        <h3>Faturas próximas</h3>
      </div>
      <div className="card-b">
        {isLoading ? (
          <WidgetSkeleton />
        ) : isError ? (
          <div role="alert" className="space-y-2">
            <p className="text-sm" style={{ color: 'var(--expense)' }}>
              Falha ao carregar faturas próximas.
            </p>
            <Button variant="ghost" size="sm" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-dim" style={{ textAlign: 'center', padding: '16px 0' }}>
            Nenhuma fatura próxima.
          </p>
        ) : (
          <ul className="divide-y" role="list">
            {data.map((inv, idx) => (
              <li key={inv.invoiceId ?? `${inv.cardName}-${idx}`} className="py-2 text-sm">
                <Link
                  to={ROUTES.CARDS}
                  className="flex items-center justify-between hover:underline focus:outline-none focus:underline"
                  aria-label={`${inv.cardName} invoice for ${inv.referenceMonth}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate fw-500">{inv.cardName}</p>
                    <p className="text-xs text-dim">
                      {inv.referenceMonth} · Vencimento:{' '}
                      {new Date(inv.dueDate).toLocaleDateString()}
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
