import { Link } from 'react-router-dom'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  TRANSACTION_TYPE_DISPLAY,
  isPositiveTransaction,
} from '@/features/transactions/utils/transaction-type'
import type { TransactionType } from '@/features/transactions/types'
import { useRecentTransactions } from '@/features/dashboard/hooks/use-recent-transactions'
import { MONTH_ABBR_PT } from '@/features/dashboard/utils'
import { ROUTES } from '@/app/router/routes'
import { Amount } from './amount'
import { Panel, PanelHeader, SkeletonBlock, WidgetEmpty, WidgetError } from './panel'

/** `05 out`, com o ano quando não é o atual: `24 mar 2025`. */
function fmtDateShort(iso: string): string {
  const parts = iso.split('-')
  const year = parseInt(parts[0] ?? '0', 10)
  const month = parseInt(parts[1] ?? '1', 10) - 1
  const day = parseInt(parts[2] ?? '1', 10)
  const label = `${String(day).padStart(2, '0')} ${MONTH_ABBR_PT[month] ?? ''}`
  return year === new Date().getFullYear() ? label : `${label} ${year}`
}

/** Fundo suave + cor do ícone por tipo (tokens semânticos). */
function bubbleClass(type: TransactionType, positive: boolean): string {
  switch (type) {
    case 'INCOME':
    case 'REFUND':
      return 'bg-income-soft text-income'
    case 'EXPENSE':
      return 'bg-expense-soft text-expense'
    case 'TRANSFER':
    case 'INVOICE_PAYMENT':
      return 'bg-info-soft text-info'
    case 'MANUAL_ADJUSTMENT':
      return positive ? 'bg-income-soft text-income' : 'bg-expense-soft text-expense'
  }
}

const ROW_GRID =
  'xl:grid xl:grid-cols-[36px_minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.1fr)_80px_120px_130px]'

function RecentSkeleton() {
  return (
    <div className="flex flex-col" aria-busy="true" aria-label="Carregando transações recentes">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex min-h-[60px] items-center gap-3 border-t border-border">
          <SkeletonBlock className="h-9 w-9 flex-none !rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <SkeletonBlock className="h-3 w-36" />
            <SkeletonBlock className="h-3 w-24" />
          </div>
          <SkeletonBlock className="h-4 w-20" />
        </div>
      ))}
    </div>
  )
}

export function RecentTransactionsCard({ className = '' }: { className?: string }) {
  const { data, isLoading, isError, refetch } = useRecentTransactions(7)
  const transactions = data ?? []

  return (
    <Panel className={className} label="Transações recentes">
      <PanelHeader
        title={
          <>
            <span className="md:hidden">Recentes</span>
            <span className="hidden md:inline">Transações recentes</span>
          </>
        }
        sub="Últimos lançamentos até hoje"
        right={
          <Link
            to={ROUTES.TRANSACTIONS}
            className="inline-flex min-h-touch items-center px-1 text-body-sm font-semibold text-brand-text no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
          >
            Ver todas
          </Link>
        }
      />
      {isLoading ? (
        <RecentSkeleton />
      ) : isError ? (
        <WidgetError
          message="Erro ao carregar transações recentes."
          onRetry={() => void refetch()}
        />
      ) : transactions.length === 0 ? (
        <WidgetEmpty>Nenhuma transação recente.</WidgetEmpty>
      ) : (
        <ul className="flex flex-col">
          {transactions.map((tx) => {
            const amountValue = parseFloat(tx.amount)
            const { icon: Icon, label } = TRANSACTION_TYPE_DISPLAY[tx.type]
            const isPositive = isPositiveTransaction(tx.type, amountValue)
            const status = tx.status as 'PAID' | 'PENDING' | 'CANCELLED'
            const cancelled = status === 'CANCELLED'
            const category = tx.categoryName ?? label
            return (
              <li key={tx.id} className="border-t border-border">
                <Link
                  to={ROUTES.TRANSACTION_DETAIL.replace(':id', tx.id)}
                  className={`flex min-h-[60px] items-center gap-3 py-2 text-fg no-underline hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus xl:min-h-[52px] xl:gap-3 ${ROW_GRID} ${
                    cancelled ? 'opacity-60' : ''
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg xl:h-8 xl:w-8 ${bubbleClass(tx.type, isPositive)}`}
                    aria-hidden="true"
                  >
                    <Icon size={17} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className={`truncate text-body ${cancelled ? 'line-through' : ''}`}>
                      {tx.description}
                    </span>
                    <span className="flex min-w-0 items-center gap-2 text-caption text-fg-muted xl:hidden">
                      <span className="truncate">
                        {category} · {tx.accountName ?? '—'}
                      </span>
                      {status !== 'PAID' && (
                        <span className="flex-none">
                          <StatusBadge status={status} />
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="hidden truncate text-body-sm text-fg-muted xl:block">
                    {category}
                  </span>
                  <span className="hidden truncate text-body-sm text-fg-muted xl:block">
                    {tx.accountName ?? '—'}
                  </span>
                  <span className="hidden text-body-sm tabular-nums text-fg-muted xl:block">
                    {fmtDateShort(tx.competenceDate)}
                  </span>
                  <span className="hidden xl:block">
                    <StatusBadge status={status} />
                  </span>
                  <span className="flex flex-none flex-col items-end gap-1">
                    <Amount
                      value={isPositive ? Math.abs(amountValue) : -Math.abs(amountValue)}
                      signed
                      className={`text-body font-semibold ${
                        cancelled
                          ? 'text-fg-muted line-through'
                          : isPositive
                            ? 'text-income'
                            : 'text-fg'
                      }`}
                    />
                    <span className="font-mono text-overline font-medium text-fg-muted xl:hidden">
                      {fmtDateShort(tx.competenceDate)}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
