import { CircleAlert, Clock, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useUpcomingInvoices } from '@/features/dashboard/hooks/use-upcoming-invoices'
import type { UpcomingInvoiceItem } from '@/features/dashboard/types'
import { ROUTES } from '@/app/router/routes'
import { formatShortDate } from '@/lib/format-date'
import { daysUntil } from '@/lib/local-date'
import { invoiceLabel } from '@/features/cards/utils/invoice-month'
import { Amount } from './amount'
import { Panel, PanelHeader, SkeletonBlock, WidgetEmpty, WidgetError } from './panel'

/** A mesma janela de "Próximas contas"; vencidas entram sempre. */
const UPCOMING_DAYS = 14

/** Tokens de categoria usados como "cor do cartão" — só para diferenciar visualmente. */
const CHIP_TOKENS = [5, 7, 2, 4, 9]

const STATUS_LABEL: Record<UpcomingInvoiceItem['status'], string> = {
  CLOSED: 'Fechada',
  PARTIAL: 'Paga em parte',
  OVERDUE: 'Vencida',
}

function statusTone(inv: UpcomingInvoiceItem, days: number) {
  if (inv.status === 'OVERDUE' || days < 0)
    return { cls: 'text-overdue', Icon: CircleAlert, label: 'Vencida' }
  if (days <= 3) return { cls: 'text-pending', Icon: Clock, label: STATUS_LABEL[inv.status] }
  return { cls: 'text-info', Icon: Info, label: STATUS_LABEL[inv.status] }
}

function InvoicesSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Carregando faturas em aberto">
      {[1, 2].map((i) => (
        <SkeletonBlock key={i} className="h-[76px] !rounded-xl" />
      ))}
    </div>
  )
}

export function OpenInvoicesCard({ className = '' }: { className?: string }) {
  const { data, isLoading, isError, refetch } = useUpcomingInvoices(UPCOMING_DAYS)
  const invoices = data ?? []

  return (
    <Panel className={className} label="Faturas a pagar">
      <PanelHeader
        title="Faturas a pagar"
        sub={`${invoices.length} ${invoices.length === 1 ? 'fatura' : 'faturas'} · vencidas e próximos ${UPCOMING_DAYS} dias`}
        right={
          <Link
            to={ROUTES.CARDS}
            className="inline-flex min-h-touch items-center px-1 text-body-sm font-semibold text-brand-text no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
          >
            Ver cartões
          </Link>
        }
      />
      {isLoading ? (
        <InvoicesSkeleton />
      ) : isError ? (
        <WidgetError message="Erro ao carregar faturas a pagar." onRetry={() => void refetch()} />
      ) : invoices.length === 0 ? (
        <WidgetEmpty>Nenhuma fatura fechada a pagar.</WidgetEmpty>
      ) : (
        <ul className="flex flex-col gap-2">
          {invoices.map((inv, idx) => {
            const days = daysUntil(inv.dueDate)
            const tone = statusTone(inv, days)
            const token = CHIP_TOKENS[idx % CHIP_TOKENS.length] ?? 5
            return (
              <li
                key={inv.invoiceId}
                className="flex items-center gap-3 rounded-xl bg-surface-2 p-3"
              >
                <span
                  className="h-[30px] w-[46px] flex-none rounded-[6px]"
                  style={{
                    background: `linear-gradient(135deg, rgb(var(--cc-cat-${token})), rgb(var(--cc-cat-${token}) / .45))`,
                  }}
                  aria-hidden="true"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <Amount
                    value={parseFloat(inv.remainingAmount)}
                    className="text-amount-lg font-bold"
                  />
                  <span className="text-caption text-fg-muted">
                    <Link
                      to={ROUTES.CARDS}
                      className="font-medium text-fg no-underline hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
                    >
                      {inv.cardName}
                    </Link>{' '}
                    · {invoiceLabel(inv.dueDate)} · vence {formatShortDate(inv.dueDate)} ·{' '}
                    <span className={`inline-flex items-center gap-1 font-semibold ${tone.cls}`}>
                      <tone.Icon size={12} aria-hidden="true" />
                      {tone.label}
                    </span>
                  </span>
                </span>
                <Link
                  to={ROUTES.INVOICE_DETAIL.replace(':invoiceId', inv.invoiceId)}
                  className="btn btn-primary btn-sm min-h-touch flex-none"
                  aria-label={`Pagar fatura de ${invoiceLabel(inv.dueDate)}`}
                >
                  Pagar
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
