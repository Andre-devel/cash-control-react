import { CircleAlert, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useUpcomingBills } from '@/features/dashboard/hooks/use-upcoming-bills'
import { ROUTES } from '@/app/router/routes'
import { daysUntil } from '@/lib/local-date'
import { formatLocalDate } from '@/lib/format-date'
import { MONTH_ABBR_PT } from '@/features/dashboard/utils'
import { Amount } from './amount'
import { Panel, PanelHeader, SkeletonBlock, WidgetEmpty, WidgetError } from './panel'

const UPCOMING_DAYS = 14

function BillsSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Carregando próximas contas">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex min-h-[60px] items-center gap-3">
          <SkeletonBlock className="h-11 w-10 flex-none" />
          <div className="flex flex-1 flex-col gap-2">
            <SkeletonBlock className="h-3 w-32" />
            <SkeletonBlock className="h-3 w-20" />
          </div>
          <SkeletonBlock className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

export function UpcomingBillsCard({ className = '' }: { className?: string }) {
  const { data, isLoading, isError, refetch } = useUpcomingBills(UPCOMING_DAYS)
  const bills = data?.slice(0, 5) ?? []
  const overdueCount = bills.filter((b) => b.status === 'OVERDUE').length

  return (
    <Panel className={className} label="Próximas contas">
      <PanelHeader
        title={
          <>
            <span className="md:hidden">A vencer</span>
            <span className="hidden md:inline">Próximas contas</span>
          </>
        }
        sub={`${bills.length} pendente${bills.length !== 1 ? 's' : ''} nos próximos ${UPCOMING_DAYS} dias`}
        right={
          <>
            {overdueCount > 0 && (
              <span className="flex items-center gap-1 text-caption font-semibold text-overdue">
                <CircleAlert size={14} aria-hidden="true" />
                {overdueCount} {overdueCount === 1 ? 'vencida' : 'vencidas'}
              </span>
            )}
            <Link
              to={ROUTES.TRANSACTIONS}
              className="inline-flex min-h-touch items-center px-1 text-body-sm font-semibold text-brand-text no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
            >
              Ver todas
            </Link>
          </>
        }
      />
      {isLoading ? (
        <BillsSkeleton />
      ) : isError ? (
        <WidgetError message="Erro ao carregar próximas contas." onRetry={() => void refetch()} />
      ) : bills.length === 0 ? (
        <WidgetEmpty>Nenhuma conta nos próximos {UPCOMING_DAYS} dias.</WidgetEmpty>
      ) : (
        <ul className="flex flex-col">
          {bills.map((bill) => {
            const overdue = bill.status === 'OVERDUE'
            const days = Math.max(0, daysUntil(bill.paymentDate))
            const [, mm, dd] = bill.paymentDate.split('-')
            return (
              <li key={bill.id} className="flex min-h-[64px] items-center gap-3 py-1.5">
                <span
                  className={`flex h-12 w-11 flex-none flex-col items-center justify-center gap-0.5 rounded-lg ${
                    overdue ? 'bg-overdue-soft text-overdue' : 'bg-surface-2'
                  }`}
                  aria-hidden="true"
                >
                  <span className="text-[17px] font-bold leading-none tabular-nums">{dd}</span>
                  <span className="text-overline uppercase opacity-80">
                    {MONTH_ABBR_PT[Number(mm) - 1] ?? mm}
                  </span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                  <span className="w-full truncate text-body">{bill.description}</span>
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-fg-muted">
                    {overdue ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-overdue-soft px-2 py-0.5 font-semibold text-overdue">
                        <CircleAlert size={12} aria-hidden="true" />
                        Vencida
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-pending-soft px-2 py-0.5 font-semibold text-pending">
                        <Clock size={12} aria-hidden="true" />
                        Pendente
                      </span>
                    )}
                    <span className="truncate">
                      <span className="sr-only">
                        vence em {formatLocalDate(bill.paymentDate)} ·{' '}
                      </span>
                      {bill.accountName ?? 'Conta'}
                      {!overdue && days <= 3 && ` · em ${days}d`}
                    </span>
                  </span>
                </span>
                <Amount
                  value={parseFloat(bill.amount)}
                  className={`text-body font-semibold ${overdue ? 'text-overdue' : ''}`}
                />
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
