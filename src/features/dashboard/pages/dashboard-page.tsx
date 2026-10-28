import { useState } from 'react'
import { Download, Plus, Wallet, ArrowDown, ArrowUp, BarChart2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildCsvBlob, csvMoney, localIsoDate, saveBlob } from '@/lib'
import { formatMoney } from '@/lib/money'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useOverview } from '@/features/dashboard/hooks/use-overview'
import { useMonthlyChart } from '@/features/dashboard/hooks/use-monthly-chart'
import { KpiCard } from '@/features/dashboard/components/kpi-card'
import { BarChartCard } from '@/features/dashboard/components/bar-chart-card'
import { UpcomingBillsCard } from '@/features/dashboard/components/upcoming-bills-card'
import { OpenInvoicesCard } from '@/features/dashboard/components/open-invoices-card'
import { RecentTransactionsCard } from '@/features/dashboard/components/recent-transactions-card'
import { CategoriesChartSection } from '@/features/dashboard/components/categories-chart-section'
import { NetWorthChartSection } from '@/features/dashboard/components/net-worth-chart-section'
import { MonthComparisonSection } from '@/features/dashboard/components/month-comparison-section'
import { LargestExpensesWidget } from '@/features/dashboard/components/largest-expenses-widget'
import { CreateTransactionDialog } from '@/features/transactions/components/create-transaction-dialog'

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

type DeltaKind = 'up' | 'down' | 'neutral'

interface KpiDelta {
  text: string
  kind: DeltaKind
  trend?: 'up' | 'down'
}

function signOf(value: number): 'up' | 'down' | undefined {
  return value > 0 ? 'up' : value < 0 ? 'down' : undefined
}

/** Variação percentual de um fluxo do mês contra o mês anterior. `higherIsBetter` define a cor. */
function flowDelta(current: number, previous: number, prevLabel: string, higherIsBetter: boolean) {
  if (previous === 0) return { text: `Sem movimento em ${prevLabel}`, kind: 'neutral' } as KpiDelta
  const pct = ((current - previous) / Math.abs(previous)) * 100
  const trend = signOf(Math.round(pct))
  const good = higherIsBetter ? pct > 0 : pct < 0
  return {
    text: `${pct > 0 ? '+' : ''}${pct.toFixed(0)}% vs ${prevLabel}`,
    kind: trend ? (good ? 'up' : 'down') : 'neutral',
    trend,
  } as KpiDelta
}

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
  const [chartMonths, setChartMonths] = useState(6)
  const [createOpen, setCreateOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const userName = user?.name ?? 'Usuário'

  const now = new Date()
  const monthName = MONTH_NAMES_PT[now.getMonth()] ?? ''
  const monthAbbr = MONTH_ABBR_PT[now.getMonth()] ?? ''
  const year = now.getFullYear()
  const prevMonthLabel = `${MONTH_ABBR_PT[(now.getMonth() + 11) % 12]}.`

  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
    refetch: retryOverview,
  } = useOverview()

  const { data: chartData } = useMonthlyChart(chartMonths)

  // Patrimônio inclui as contas de investimento: aplicar não diminui o que a pessoa tem.
  const netWorth = overview ? parseFloat(overview.netWorth ?? overview.totalBalance) : 0
  const monthlyIncome = overview ? parseFloat(overview.monthlyIncome) : 0
  const monthlyExpenses = overview ? parseFloat(overview.monthlyExpenses) : 0
  const balanceDelta = monthlyIncome - monthlyExpenses

  const netWorthChange = netWorth - parseFloat(overview?.previousNetWorth ?? String(netWorth))
  const netWorthDelta: KpiDelta = {
    text:
      netWorthChange === 0
        ? `Igual ao fim de ${prevMonthLabel}`
        : `${netWorthChange > 0 ? '+' : '−'}${formatMoney(Math.abs(netWorthChange))} desde ${prevMonthLabel}`,
    kind: signOf(netWorthChange) ?? 'neutral',
  }
  const incomeDelta = flowDelta(
    monthlyIncome,
    parseFloat(overview?.previousMonthIncome ?? '0'),
    prevMonthLabel,
    true,
  )
  const expensesDelta = flowDelta(
    monthlyExpenses,
    parseFloat(overview?.previousMonthExpenses ?? '0'),
    prevMonthLabel,
    false,
  )

  function handleExport() {
    const rows: string[][] = [['Mês', 'Receitas (R$)', 'Despesas (R$)', 'Saldo (R$)']]
    const entries = chartData?.months ?? []
    for (const entry of entries) {
      const net = parseFloat(entry.income) - parseFloat(entry.expenses)
      rows.push([entry.month, csvMoney(entry.income), csvMoney(entry.expenses), csvMoney(net)])
    }
    if (overview) {
      rows.push([])
      rows.push(['Resumo atual', '', '', ''])
      rows.push(['Patrimônio total', csvMoney(netWorth), '', ''])
      rows.push([`Receitas (${monthAbbr}.)`, csvMoney(overview.monthlyIncome), '', ''])
      rows.push([`Despesas (${monthAbbr}.)`, csvMoney(overview.monthlyExpenses), '', ''])
      rows.push(['Saldo do mês', csvMoney(balanceDelta), '', ''])
    }
    saveBlob(buildCsvBlob(rows), `cash-control-${localIsoDate(now)}.csv`)
  }

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
          <Button leading={<Download size={14} />} onClick={handleExport}>
            Exportar
          </Button>
          <Button
            variant="primary"
            leading={<Plus size={14} />}
            onClick={() => setCreateOpen(true)}
          >
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
            value={netWorth}
            delta={netWorthDelta.text}
            deltaKind={netWorthDelta.kind}
          />
          <KpiCard
            label={`Receitas (${monthAbbr}.)`}
            icon={ArrowDown}
            value={monthlyIncome}
            tone="income"
            delta={incomeDelta.text}
            deltaKind={incomeDelta.kind}
            trend={incomeDelta.trend}
          />
          <KpiCard
            label={`Despesas (${monthAbbr}.)`}
            icon={ArrowUp}
            value={monthlyExpenses}
            tone="expense"
            delta={expensesDelta.text}
            deltaKind={expensesDelta.kind}
            trend={expensesDelta.trend}
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
        <BarChartCard months={chartMonths} onMonthsChange={setChartMonths} />
        <UpcomingBillsCard />
      </div>

      {/* Bottom row: open invoices + recent transactions */}
      <div className="grid mb-6" style={{ gridTemplateColumns: '1fr 1.4fr' }}>
        <OpenInvoicesCard />
        <RecentTransactionsCard />
      </div>

      {/* Charts row: categories + net worth */}
      <div className="grid mb-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <CategoriesChartSection />
        <NetWorthChartSection />
      </div>

      {/* Bottom extras: largest expenses + month comparison */}
      <div className="grid mb-6" style={{ gridTemplateColumns: '1fr 1.6fr' }}>
        <LargestExpensesWidget />
        <MonthComparisonSection />
      </div>

      <CreateTransactionDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
