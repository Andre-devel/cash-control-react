import { useState } from 'react'
import { Download, Plus, Wallet, ArrowDown, ArrowUp, BarChart2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useOverview } from '@/features/dashboard/hooks/use-overview'
import { KpiCard } from '@/features/dashboard/components/kpi-card'
import { BarChartCard } from '@/features/dashboard/components/bar-chart-card'
import { UpcomingBillsCard } from '@/features/dashboard/components/upcoming-bills-card'
import { OpenInvoicesCard } from '@/features/dashboard/components/open-invoices-card'
import { RecentTransactionsCard } from '@/features/dashboard/components/recent-transactions-card'

const MONTH_NAMES_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

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

type Period = '7d' | '30d' | 'mes' | 'ano'

const PERIODS: { id: Period; label: string }[] = [
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: 'mes', label: 'Mês' },
  { id: 'ano', label: 'Ano' },
]

function KpiSkeleton() {
  return (
    <div className="grid grid-4 mb-6 animate-pulse" aria-busy="true" aria-label="Carregando resumo">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="kpi">
          <div
            style={{ height: 12, width: 120, background: 'var(--surface-3)', borderRadius: 4 }}
          />
          <div
            style={{
              height: 32,
              width: 160,
              background: 'var(--surface-3)',
              borderRadius: 4,
              marginTop: 8,
            }}
          />
          <div
            style={{
              height: 12,
              width: 100,
              background: 'var(--surface-3)',
              borderRadius: 4,
              marginTop: 4,
            }}
          />
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('mes')
  const user = useAuthStore((s) => s.user)
  const userName = user?.name ?? 'Usuário'

  const now = new Date()
  const monthName = MONTH_NAMES_PT[now.getMonth()] ?? ''
  const monthAbbr = MONTH_ABBR_PT[now.getMonth()] ?? ''
  const year = now.getFullYear()

  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
    refetch: retryOverview,
  } = useOverview()

  const totalBalance = overview ? parseFloat(overview.totalBalance) : 0
  const monthlyIncome = overview ? parseFloat(overview.monthlyIncome) : 0
  const monthlyExpenses = overview ? parseFloat(overview.monthlyExpenses) : 0
  const balanceDelta = monthlyIncome - monthlyExpenses

  return (
    <div>
      {/* Page header */}
      <div className="page-h">
        <div>
          <h1 className="title">Olá, {userName}</h1>
          <div className="desc">
            Aqui está um resumo das suas finanças em {monthName} · {year}
          </div>
        </div>
        <div className="spacer" />
        <div className="actions">
          <div className="tabs" role="tablist" aria-label="Período">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={period === p.id}
                className={period === p.id ? 'on' : ''}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button leading={<Download size={14} />}>Exportar</Button>
          <Button variant="primary" leading={<Plus size={14} />}>
            Nova transação
          </Button>
        </div>
      </div>

      {/* KPI row */}
      {overviewLoading ? (
        <KpiSkeleton />
      ) : overviewError ? (
        <div role="alert" className="mb-6" style={{ color: 'var(--expense)', fontSize: 13 }}>
          Erro ao carregar resumo.{' '}
          <button
            type="button"
            onClick={() => void retryOverview()}
            style={{
              color: 'var(--accent)',
              textDecoration: 'underline',
              background: 'none',
              border: 0,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="grid grid-4 mb-6">
          <KpiCard
            label="Patrimônio total"
            icon={Wallet}
            value={totalBalance}
            delta="—"
            deltaKind="neutral"
          />
          <KpiCard
            label={`Receitas (${monthAbbr}.)`}
            icon={ArrowDown}
            value={monthlyIncome}
            tone="income"
            delta="—"
            deltaKind="neutral"
          />
          <KpiCard
            label={`Despesas (${monthAbbr}.)`}
            icon={ArrowUp}
            value={monthlyExpenses}
            tone="expense"
            delta="—"
            deltaKind="neutral"
          />
          <KpiCard
            label="Saldo do mês"
            icon={BarChart2}
            value={balanceDelta}
            delta="Receitas − Despesas"
            deltaKind="neutral"
            signed
          />
        </div>
      )}

      {/* Main row: bar chart + upcoming bills */}
      <div className="grid mb-6" style={{ gridTemplateColumns: '1.65fr 1fr' }}>
        <BarChartCard />
        <UpcomingBillsCard />
      </div>

      {/* Bottom row: open invoices + recent transactions */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1.4fr' }}>
        <OpenInvoicesCard />
        <RecentTransactionsCard />
      </div>
    </div>
  )
}
