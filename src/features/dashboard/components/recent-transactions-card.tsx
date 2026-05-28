import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/ui/money'
import { IconBubble } from '@/components/ui/icon-bubble'
import { StatusBadge } from '@/components/ui/status-badge'
import { useRecentTransactions } from '@/features/dashboard/hooks/use-recent-transactions'
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

type BubbleIcon = ComponentType<{ size?: number; stroke?: number }>

interface TxTypeConfig {
  icon: BubbleIcon
  color: string
  label: string
}

function asIcon(i: unknown): BubbleIcon {
  return i as BubbleIcon
}

const TX_TYPE_CONFIG: Record<string, TxTypeConfig> = {
  INCOME: { icon: asIcon(ArrowDownLeft), color: 'var(--income)', label: 'Receita' },
  EXPENSE: { icon: asIcon(ArrowUpRight), color: 'var(--expense)', label: 'Despesa' },
  TRANSFER: { icon: asIcon(ArrowLeftRight), color: 'var(--info)', label: 'Transferência' },
  REFUND: { icon: asIcon(RotateCcw), color: 'var(--income)', label: 'Reembolso' },
}

function TableSkeleton() {
  return (
    <table className="tbl" aria-busy="true" aria-label="Carregando transações recentes">
      <tbody>
        {[1, 2, 3, 4, 5].map((i) => (
          <tr key={i}>
            <td style={{ paddingLeft: 16, width: 44 }}>
              <div
                style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--surface-3)' }}
              />
            </td>
            <td>
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
            </td>
            <td>
              <div
                style={{ height: 16, width: 60, background: 'var(--surface-3)', borderRadius: 4 }}
              />
            </td>
            <td>
              <div
                style={{ height: 12, width: 40, background: 'var(--surface-3)', borderRadius: 4 }}
              />
            </td>
            <td style={{ paddingRight: 16 }}>
              <div
                style={{ height: 16, width: 70, background: 'var(--surface-3)', borderRadius: 4 }}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function RecentTransactionsCard() {
  const { data, isLoading, isError, refetch } = useRecentTransactions(7)
  const transactions = data ?? []

  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Transações recentes</h3>
          <div className="sub">Últimas atualizações</div>
        </div>
        <div className="right">
          <Button size="sm" variant="ghost" asChild>
            <Link to={ROUTES.TRANSACTIONS}>Ver todas</Link>
          </Button>
        </div>
      </div>
      <div className="card-b flush">
        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <div style={{ padding: 16 }} role="alert">
            <p style={{ color: 'var(--expense)', fontSize: 13 }}>
              Erro ao carregar transações recentes.
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
        ) : transactions.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)', fontSize: 13 }}>
            Nenhuma transação recente.
          </p>
        ) : (
          <table className="tbl">
            <tbody>
              {transactions.map((tx) => {
                const cfg = TX_TYPE_CONFIG[tx.type] ?? (TX_TYPE_CONFIG.EXPENSE as TxTypeConfig)
                const amountValue = parseFloat(tx.amount)
                const amountColor =
                  tx.type === 'INCOME' || tx.type === 'REFUND' ? 'var(--income)' : 'var(--text)'
                const status = tx.status as 'PAID' | 'PENDING' | 'CANCELLED'

                return (
                  <tr key={tx.id}>
                    <td style={{ paddingLeft: 16, width: 44 }}>
                      <IconBubble color={cfg.color} icon={cfg.icon} size="sm" />
                    </td>
                    <td style={{ whiteSpace: 'normal' }}>
                      <Link
                        to={ROUTES.TRANSACTION_DETAIL.replace(':id', tx.id)}
                        style={{ color: 'inherit', textDecoration: 'none' }}
                        aria-label={tx.description}
                      >
                        <div style={{ fontWeight: 500 }}>{tx.description}</div>
                        <div className="row-meta">
                          {cfg.label} · {tx.accountName ?? '—'}
                        </div>
                      </Link>
                    </td>
                    <td>
                      <StatusBadge status={status} />
                    </td>
                    <td className="text-xs text-dim" style={{ width: 90 }}>
                      {fmtDateShort(tx.date)}
                    </td>
                    <td
                      className="num"
                      style={{ paddingRight: 16, color: amountColor, fontWeight: 500 }}
                    >
                      <Money
                        value={amountValue}
                        signed={tx.type === 'INCOME' || tx.type === 'REFUND'}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
