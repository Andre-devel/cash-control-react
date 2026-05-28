import type { ComponentType } from 'react'
import { CreditCard } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Money } from '@/components/ui/money'
import { IconBubble } from '@/components/ui/icon-bubble'
import { useUpcomingInvoices } from '@/features/dashboard/hooks/use-upcoming-invoices'
import { ROUTES } from '@/app/router/routes'

const MONTH_ABBR_PT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

function fmtDateShort(iso: string): string {
  const parts = iso.split('-')
  const month = parseInt(parts[1] ?? '1', 10) - 1
  const day = parseInt(parts[2] ?? '1', 10)
  return `${String(day).padStart(2, '0')} ${MONTH_ABBR_PT[month] ?? ''}`
}

function daysUntil(iso: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(iso + 'T00:00:00')
  return Math.max(0, Math.ceil((d.getTime() - today.getTime()) / 86400000))
}

const INVOICE_COLORS = ['#60a5fa', '#c084fc', '#34d399', '#fbbf24', '#fb7185']

function CardSkeleton() {
  return (
    <div
      className="card-b animate-pulse"
      style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      aria-busy="true"
      aria-label="Carregando faturas em aberto"
    >
      {[1, 2].map((i) => (
        <div key={i} style={{ height: 100, background: 'var(--surface-2)', borderRadius: 10 }} />
      ))}
    </div>
  )
}

export function OpenInvoicesCard() {
  const { data, isLoading, isError, refetch } = useUpcomingInvoices()
  const invoices = data ?? []

  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Faturas em aberto</h3>
          <div className="sub">
            {invoices.length} cartão{invoices.length !== 1 ? 'ões' : ''} com fatura aberta
          </div>
        </div>
        <div className="right">
          <Button size="sm" variant="ghost" asChild>
            <Link to={ROUTES.CARDS}>Ver cartões</Link>
          </Button>
        </div>
      </div>
      {isLoading ? (
        <CardSkeleton />
      ) : isError ? (
        <div className="card-b" role="alert">
          <p style={{ color: 'var(--expense)', fontSize: 13 }}>
            Erro ao carregar faturas em aberto.
          </p>
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
      ) : invoices.length === 0 ? (
        <div
          className="card-b"
          style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}
        >
          Nenhuma fatura em aberto.
        </div>
      ) : (
        <div
          className="card-b"
          style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          {invoices.map((inv, idx) => {
            const color = INVOICE_COLORS[idx % INVOICE_COLORS.length] ?? '#60a5fa'
            const days = daysUntil(inv.dueDate)
            return (
              <div
                key={`${inv.cardId}-${inv.referenceMonth}`}
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${color}26, transparent 60%), var(--surface-2)`,
                  border: '1px solid var(--border)',
                }}
              >
                <div className="row between" style={{ alignItems: 'flex-start' }}>
                  <div className="row gap-2">
                    <IconBubble
                      color={color}
                      icon={CreditCard as ComponentType<{ size?: number; stroke?: number }>}
                    />
                    <div>
                      <Link
                        to={ROUTES.CARD_DETAIL.replace(':id', inv.cardId)}
                        style={{
                          fontWeight: 500,
                          fontSize: 13,
                          color: 'inherit',
                          textDecoration: 'none',
                        }}
                      >
                        {inv.cardName}
                      </Link>
                      <div className="text-xs text-dim">{inv.referenceMonth}</div>
                    </div>
                  </div>
                  <Badge kind={days <= 3 ? 'pending' : 'info'}>
                    Vence {fmtDateShort(inv.dueDate)}
                  </Badge>
                </div>
                <div className="num text-2xl mt-2" style={{ fontWeight: 500 }}>
                  <Money value={parseFloat(inv.totalAmount)} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
