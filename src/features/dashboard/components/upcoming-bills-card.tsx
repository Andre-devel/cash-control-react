import type { ComponentType } from 'react'
import { Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Money } from '@/components/ui/money'
import { IconBubble } from '@/components/ui/icon-bubble'
import { useUpcomingBills } from '@/features/dashboard/hooks/use-upcoming-bills'
import { formatShortDate } from '@/lib/format-date'
import { daysUntil } from '@/lib/local-date'

function CardSkeleton() {
  return (
    <div
      className="card-b flush animate-pulse"
      aria-busy="true"
      aria-label="Carregando próximas contas"
    >
      {[1, 2, 3].map((i) => (
        <div key={i} className="list-row">
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--surface-3)' }} />
          <div style={{ flex: 1 }}>
            <div
              style={{ height: 12, width: 120, background: 'var(--surface-3)', borderRadius: 4 }}
            />
            <div
              style={{
                height: 10,
                width: 80,
                background: 'var(--surface-3)',
                borderRadius: 4,
                marginTop: 4,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function UpcomingBillsCard() {
  const { data, isLoading, isError, refetch } = useUpcomingBills(14)
  const bills = data?.slice(0, 5) ?? []

  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Próximas contas</h3>
          <div className="sub">
            {bills.length} pendente{bills.length !== 1 ? 's' : ''} nos próximos 14 dias
          </div>
        </div>
        <div className="right">
          <Button size="sm" variant="ghost">
            Ver todas
          </Button>
        </div>
      </div>
      {isLoading ? (
        <CardSkeleton />
      ) : isError ? (
        <div className="card-b" role="alert">
          <p style={{ color: 'var(--expense)', fontSize: 13 }}>Erro ao carregar próximas contas.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            style={{
              color: 'var(--accent)',
              textDecoration: 'underline',
              background: 'none',
              border: 0,
              cursor: 'pointer',
              fontSize: 13,
              marginTop: 4,
            }}
          >
            Tentar novamente
          </button>
        </div>
      ) : bills.length === 0 ? (
        <div
          className="card-b"
          style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}
        >
          Nenhuma conta nos próximos 14 dias.
        </div>
      ) : (
        <div className="card-b flush">
          {bills.map((bill) => {
            const overdue = bill.status === 'OVERDUE'
            const days = Math.max(0, daysUntil(bill.paymentDate))
            return (
              <div className="list-row" key={bill.id}>
                <IconBubble
                  color="#60a5fa"
                  icon={Wallet as ComponentType<{ size?: number; stroke?: number }>}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    className="title"
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {bill.description}
                  </div>
                  <div className="meta">
                    {bill.accountName ?? 'Conta'} · vence {formatShortDate(bill.paymentDate)}
                    {overdue && <span style={{ color: 'var(--expense)' }}> · vencida</span>}
                    {!overdue && days <= 3 && (
                      <span style={{ color: 'var(--pending)' }}> · em {days}d</span>
                    )}
                  </div>
                </div>
                <div className="right">
                  <div className="amount" style={{ color: 'var(--expense)' }}>
                    <Money value={parseFloat(bill.amount)} />
                  </div>
                  <Badge kind="pending" style={{ marginTop: 4 }}>
                    Pendente
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
