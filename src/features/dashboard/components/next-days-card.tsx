import { CalendarDays, CircleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/app/router/routes'
import { useBalanceProjection } from '@/features/dashboard/hooks/use-balance-projection'
import { useUpcomingBills } from '@/features/dashboard/hooks/use-upcoming-bills'
import { useUpcomingInvoices } from '@/features/dashboard/hooks/use-upcoming-invoices'
import type { BalanceProjectionPoint } from '@/features/dashboard/types'
import { invoiceLabel } from '@/features/cards/utils/invoice-month'
import { formatShortDate } from '@/lib/format-date'
import { daysUntil } from '@/lib/local-date'
import { Amount } from './amount'
import { Panel, PanelHeader, SkeletonBlock, WidgetError } from './panel'

/** Uma janela só para a projeção e para o que vence: o card responde "e os próximos 30 dias?". */
const DAYS = 30
const MAX_ITEMS = 5

const LINK =
  'inline-flex min-h-touch items-center px-1 text-body-sm font-semibold text-brand-text no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus'

interface DueItem {
  key: string
  date: string
  title: string
  amount: number
  overdue: boolean
  /** Fatura: link para pagar. Conta avulsa: sem ação aqui. */
  invoiceId?: string
}

function whenLabel(date: string, overdue: boolean): string {
  const days = daysUntil(date)
  if (overdue || days < 0) return `venceu ${formatShortDate(date)}`
  if (days === 0) return 'vence hoje'
  if (days === 1) return 'vence amanhã'
  return `vence ${formatShortDate(date)} · em ${days} dias`
}

/** Linha da projeção desenhada à mão: 96×40 não pede um gráfico de verdade. */
function Sparkline({ points, negative }: { points: BalanceProjectionPoint[]; negative: boolean }) {
  if (points.length < 2) return null
  const values = points.map((p) => Number(p.balance))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const W = 96
  const H = 40
  const coords = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W
    const y = 4 + (1 - (v - min) / span) * (H - 8)
    return `${x.toFixed(1)} ${y.toFixed(1)}`
  })
  const line = `M${coords.join(' L')}`
  const color = negative ? 'rgb(var(--cc-expense))' : 'rgb(var(--cc-brand))'
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="flex-none">
      <path d={`${line} L${W} ${H} L0 ${H} Z`} fill={color} fillOpacity={0.12} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Celular: junta a projeção de saldo, as contas a vencer e as faturas a pagar num card só —
 * é o que pede ação. No tablet/desktop os três continuam separados.
 */
export function NextDaysCard({ className = '' }: { className?: string }) {
  const projection = useBalanceProjection(DAYS)
  const bills = useUpcomingBills(DAYS)
  const invoices = useUpcomingInvoices(DAYS)

  const loadingDue = bills.isLoading || invoices.isLoading
  const dueError = bills.isError || invoices.isError

  const items: DueItem[] = [
    ...(bills.data ?? []).map((b) => ({
      key: `b-${b.id}`,
      date: b.paymentDate,
      title: b.description,
      amount: parseFloat(b.amount),
      overdue: b.status === 'OVERDUE',
    })),
    ...(invoices.data ?? []).map((inv) => ({
      key: `i-${inv.invoiceId}`,
      date: inv.dueDate,
      title: `Fatura ${inv.cardName}`,
      amount: parseFloat(inv.remainingAmount),
      overdue: inv.status === 'OVERDUE',
      invoiceId: inv.invoiceId,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date))
  const shown = items.slice(0, MAX_ITEMS)

  const data = projection.data
  const end = Number(data?.endBalance ?? 0)
  const goesNegative = data?.firstNegativeDate != null

  return (
    <Panel className={className} label="Próximos 30 dias">
      <PanelHeader
        title="Próximos 30 dias"
        right={
          <Link to={ROUTES.TRANSACTIONS} className={LINK}>
            Ver todas
          </Link>
        }
      />

      {projection.isLoading ? (
        <SkeletonBlock className="mb-3 h-16 !rounded-xl" />
      ) : projection.isError || !data ? (
        <WidgetError
          message="Falha ao carregar projeção de saldo."
          onRetry={() => void projection.refetch()}
        />
      ) : (
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-surface-2 p-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-caption text-fg-muted">
              Saldo previsto em {formatShortDate(data.to)}
            </span>
            <Amount
              value={end}
              className={`text-[1.0625rem] font-bold ${end < 0 ? 'text-expense' : 'text-fg'}`}
            />
            {goesNegative ? (
              <span className="flex items-center gap-1 text-caption font-semibold text-expense">
                <CircleAlert size={12} aria-hidden="true" />
                fica negativo em {formatShortDate(data.firstNegativeDate)}
              </span>
            ) : (
              <span className="text-caption text-fg-muted">
                menor ponto: {formatShortDate(data.lowest.date)}
              </span>
            )}
          </div>
          <Sparkline points={data.points} negative={goesNegative} />
        </div>
      )}

      <h3 className="pb-1 text-caption font-medium text-fg-muted">A pagar</h3>
      {loadingDue ? (
        <SkeletonBlock className="h-12" />
      ) : dueError ? (
        <WidgetError
          message="Erro ao carregar o que vence."
          onRetry={() => {
            void bills.refetch()
            void invoices.refetch()
          }}
        />
      ) : shown.length === 0 ? (
        <p className="flex min-h-[48px] items-center gap-3 text-body-sm text-fg-muted">
          <CalendarDays size={18} aria-hidden="true" />
          Nada a pagar nos próximos {DAYS} dias.
        </p>
      ) : (
        <ul className="flex flex-col">
          {shown.map((item, idx) => {
            const days = daysUntil(item.date)
            const urgent = item.overdue || days < 0
            const soon = !urgent && days <= 3
            return (
              <li
                key={item.key}
                className={`flex min-h-[52px] items-center gap-3 py-1.5 ${idx > 0 ? 'border-t border-border' : ''}`}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-body-sm font-semibold">{item.title}</span>
                  <span
                    className={`text-caption ${urgent ? 'text-overdue' : soon ? 'text-pending' : 'text-fg-muted'}`}
                  >
                    {whenLabel(item.date, item.overdue)}
                  </span>
                </span>
                <Amount value={item.amount} className="text-body-sm font-bold" />
                {item.invoiceId && (
                  <Link
                    to={ROUTES.INVOICE_DETAIL.replace(':invoiceId', item.invoiceId)}
                    className="btn btn-primary btn-sm min-h-touch flex-none"
                    aria-label={`Pagar fatura de ${invoiceLabel(item.date)}`}
                  >
                    Pagar
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {items.length > MAX_ITEMS && (
        <p className="pt-1 text-caption text-fg-muted">
          e mais {items.length - MAX_ITEMS} nos próximos {DAYS} dias
        </p>
      )}
    </Panel>
  )
}
