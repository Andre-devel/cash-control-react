import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useUpcomingBills } from '@/features/dashboard/hooks/use-upcoming-bills'

function WidgetSkeleton() {
  return (
    <div
      className="space-y-2 animate-pulse"
      aria-busy="true"
      aria-label="Carregando contas a pagar"
    >
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-10 rounded" style={{ background: 'var(--surface-3)' }} />
      ))}
    </div>
  )
}

export function UpcomingBillsWidget() {
  const [daysAhead, setDaysAhead] = useState(7)
  const { data, isLoading, isError, refetch } = useUpcomingBills(daysAhead)

  return (
    <div className="card">
      <div className="card-h">
        <h3>Contas a pagar</h3>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="days-ahead" className="text-xs text-dim">
            Dias à frente:
          </label>
          <select
            id="days-ahead"
            value={daysAhead}
            onChange={(e) => setDaysAhead(Number(e.target.value))}
            className="select"
            style={{ fontSize: 12, padding: '2px 8px', height: 'auto' }}
            aria-label="Dias à frente"
          >
            {[7, 14, 30].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="card-b">
        {isLoading ? (
          <WidgetSkeleton />
        ) : isError ? (
          <div role="alert" className="space-y-2">
            <p className="text-sm" style={{ color: 'var(--expense)' }}>
              Falha ao carregar contas a pagar.
            </p>
            <Button variant="ghost" size="sm" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-dim" style={{ textAlign: 'center', padding: '16px 0' }}>
            Nenhuma conta nos próximos {daysAhead} dias.
          </p>
        ) : (
          <ul className="divide-y" role="list">
            {data.map((bill) => {
              const overdue = bill.status === 'OVERDUE'
              return (
                <li
                  key={bill.id}
                  className="flex items-center justify-between py-2 text-sm"
                  style={overdue ? { color: 'var(--expense)' } : undefined}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate fw-500">{bill.description}</p>
                    <p
                      className="text-xs"
                      style={{ color: overdue ? 'var(--expense)' : 'var(--text-dim)' }}
                    >
                      Vencimento: {new Date(bill.paymentDate).toLocaleDateString()}
                      {overdue && ' — Vencida'}
                    </p>
                  </div>
                  <span className="mono fw-600 ml-4">{bill.amount}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
