import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Eye, EyeOff, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { buildCsvBlob, csvMoney, localIsoDate, saveBlob } from '@/lib'
import { formatMoney } from '@/lib/money'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useOverview } from '@/features/dashboard/hooks/use-overview'
import { useMonthlyChart } from '@/features/dashboard/hooks/use-monthly-chart'
import { useHideValues } from '@/features/dashboard/hooks/use-hide-values'
import { useDiscountInvoices } from '@/lib/discount-invoices'
import { useInvestmentSummary } from '@/features/investments/hooks/use-investments'
import { toNumber } from '@/features/investments/utils/labels'
import {
  HIDDEN_MONEY,
  initialsOf,
  monthAbbr,
  monthName as monthNameOf,
  shiftYearMonth,
  toYearMonth,
} from '@/features/dashboard/utils'
import { MonthSummary, type SummaryDelta } from '@/features/dashboard/components/month-summary'
import { MonthStepper } from '@/features/dashboard/components/month-picker'
import { MobileSummary } from '@/features/dashboard/components/mobile-summary'
import { NextDaysCard } from '@/features/dashboard/components/next-days-card'
import { MobileShortcuts } from '@/features/dashboard/components/mobile-shortcuts'
import { useMediaQuery, MOBILE_QUERY } from '@/hooks/use-media-query'
import { BarChartCard } from '@/features/dashboard/components/bar-chart-card'
import { UpcomingBillsCard } from '@/features/dashboard/components/upcoming-bills-card'
import { OpenInvoicesCard } from '@/features/dashboard/components/open-invoices-card'
import { RecentTransactionsCard } from '@/features/dashboard/components/recent-transactions-card'
import { CategoriesChartSection } from '@/features/dashboard/components/categories-chart-section'
import { NetWorthChartSection } from '@/features/dashboard/components/net-worth-chart-section'
import { BalanceProjectionSection } from '@/features/dashboard/components/balance-projection-section'
import { InvestmentsCard } from '@/features/dashboard/components/investments-card'
import { BudgetsCard } from '@/features/dashboard/components/budgets-card'
import { SubscriptionsCard } from '@/features/dashboard/components/subscriptions-card'
import { GoalsCard } from '@/features/dashboard/components/goals-card'
import { useGoals } from '@/features/goals/hooks/use-goals'
import { MonthComparisonSection } from '@/features/dashboard/components/month-comparison-section'
import { LargestExpensesWidget } from '@/features/dashboard/components/largest-expenses-widget'
import { ROUTES } from '@/app/router/routes'
import { ScopeSelector } from '@/components/layout/scope-selector'
import { CreateTransactionDialog } from '@/features/transactions/components/create-transaction-dialog'

/** Quantos meses o seletor do topo oferece (o atual e os anteriores). */
const SUMMARY_MONTHS = 6

function signOf(value: number): 'up' | 'down' | undefined {
  return value > 0 ? 'up' : value < 0 ? 'down' : undefined
}

/** Variação percentual de um fluxo do mês contra o mês anterior. `higherIsBetter` define a cor. */
function flowDelta(
  current: number,
  previous: number,
  prevLabel: string,
  higherIsBetter: boolean,
): SummaryDelta {
  if (previous === 0) return { text: `Sem movimento em ${prevLabel}`, kind: 'neutral' }
  const pct = ((current - previous) / Math.abs(previous)) * 100
  const trend = signOf(Math.round(pct))
  const good = higherIsBetter ? pct > 0 : pct < 0
  return {
    text: `${pct > 0 ? '+' : ''}${pct.toFixed(0)}% vs ${prevLabel}`,
    kind: trend ? (good ? 'up' : 'down') : 'neutral',
    trend,
  }
}

const ICON_BTN =
  'btn btn-icon min-h-touch min-w-touch rounded-lg border border-border bg-surface-1 text-fg'

export default function DashboardPage() {
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const [chartMonths, setChartMonths] = useState(6)
  const [createOpen, setCreateOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const userName = user?.name ?? 'Usuário'
  const firstName = userName.trim().split(/\s+/)[0] || userName
  const { hidden, toggle: toggleHidden } = useHideValues()
  const { discount: discountInvoices, toggle: toggleDiscountInvoices } = useDiscountInvoices()
  const { data: investments } = useInvestmentSummary()
  const { data: goals } = useGoals()
  // Card só para quem tem conta de investimento ou aplicação; sem ele, a projeção ocupa a linha.
  const showInvestments =
    investments !== undefined &&
    (investments.accounts.length > 0 || toNumber(investments.totalGross) > 0)

  const now = new Date()
  const year = now.getFullYear()
  const currentKey = toYearMonth(now)
  const monthOptions = Array.from({ length: SUMMARY_MONTHS }, (_, i) =>
    shiftYearMonth(currentKey, i - (SUMMARY_MONTHS - 1)),
  )
  const [selectedMonth, setSelectedMonth] = useState(currentKey)
  const isCurrentMonth = selectedMonth === currentKey
  const monthAbbrLabel = monthAbbr(currentKey)
  const prevMonthLabel = `${monthAbbr(shiftYearMonth(currentKey, -1))}.`
  const selectedPrevLabel = `${monthAbbr(shiftYearMonth(selectedMonth, -1))}.`

  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
    refetch: retryOverview,
  } = useOverview()

  const { data: chartData } = useMonthlyChart(chartMonths)
  const { data: summaryChart, isLoading: summaryChartLoading } = useMonthlyChart(SUMMARY_MONTHS)

  // Patrimônio inclui os investimentos pelo líquido de IR/IOF: aplicar não diminui o que a pessoa tem.
  const netWorth = overview ? parseFloat(overview.netWorth ?? overview.totalBalance) : 0
  const monthlyIncome = overview ? parseFloat(overview.monthlyIncome) : 0
  const monthlyExpenses = overview ? parseFloat(overview.monthlyExpenses) : 0
  const balanceDelta = monthlyIncome - monthlyExpenses

  const netWorthChange = netWorth - parseFloat(overview?.previousNetWorth ?? String(netWorth))
  const netWorthDelta: SummaryDelta = {
    text:
      netWorthChange === 0
        ? `Igual ao fim de ${prevMonthLabel}`
        : `${netWorthChange > 0 ? '+' : '−'}${hidden ? HIDDEN_MONEY : formatMoney(Math.abs(netWorthChange))} desde ${prevMonthLabel}`,
    kind: signOf(netWorthChange) ?? 'neutral',
  }

  // Mês atual vem do overview; meses anteriores, do gráfico mensal (mesmas regras de soma).
  const chartEntries = summaryChart?.months ?? []
  const selectedEntry = chartEntries.find((e) => e.month === selectedMonth)
  const previousEntry = chartEntries.find((e) => e.month === shiftYearMonth(selectedMonth, -1))

  let income = monthlyIncome
  let expenses = monthlyExpenses
  let incomeDelta: SummaryDelta | null = null
  let expensesDelta: SummaryDelta | null = null
  if (isCurrentMonth) {
    incomeDelta = flowDelta(
      monthlyIncome,
      parseFloat(overview?.previousMonthIncome ?? '0'),
      prevMonthLabel,
      true,
    )
    expensesDelta = flowDelta(
      monthlyExpenses,
      parseFloat(overview?.previousMonthExpenses ?? '0'),
      prevMonthLabel,
      false,
    )
  } else {
    income = selectedEntry ? parseFloat(selectedEntry.income) : 0
    expenses = selectedEntry ? parseFloat(selectedEntry.expenses) : 0
    if (previousEntry) {
      incomeDelta = flowDelta(income, parseFloat(previousEntry.income), selectedPrevLabel, true)
      expensesDelta = flowDelta(
        expenses,
        parseFloat(previousEntry.expenses),
        selectedPrevLabel,
        false,
      )
    }
  }

  const summaryStatus = overviewLoading
    ? 'loading'
    : overviewError
      ? 'error'
      : !isCurrentMonth && summaryChartLoading
        ? 'loading'
        : 'ready'

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
      rows.push(['Patrimônio líquido', csvMoney(netWorth), '', ''])
      rows.push([`Receitas (${monthAbbrLabel}.)`, csvMoney(overview.monthlyIncome), '', ''])
      rows.push([`Despesas (${monthAbbrLabel}.)`, csvMoney(overview.monthlyExpenses), '', ''])
      rows.push(['Saldo do mês', csvMoney(balanceDelta), '', ''])
    }
    saveBlob(buildCsvBlob(rows), `cash-control-${localIsoDate(now)}.csv`)
  }

  const selectedName = monthNameOf(selectedMonth)

  return (
    <div>
      {/* Cabeçalho: no celular, avatar + saudação + olho; no tablet/desktop, mês e ações. */}
      <div className="mb-4 flex items-center gap-3 md:mb-6">
        <Link
          to={ROUTES.PROFILE}
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand md:hidden"
          aria-label="Abrir perfil"
        >
          <Avatar name={initialsOf(userName)} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-body font-semibold text-fg md:font-display md:text-h1">
            <span className="block text-caption font-normal text-fg-muted md:inline md:text-[1em] md:text-fg md:[font-weight:inherit]">
              Olá,{' '}
            </span>
            {firstName}
          </h1>
          <p className="mt-1 hidden text-body-sm text-fg-muted md:block">
            Resumo das suas finanças em {selectedName} · {selectedMonth.slice(0, 4) || year}
          </p>
        </div>
        <div className="hidden md:block">
          <MonthStepper options={monthOptions} value={selectedMonth} onChange={setSelectedMonth} />
        </div>
        <button
          type="button"
          className={ICON_BTN}
          aria-label="Ocultar valores"
          aria-pressed={hidden}
          onClick={toggleHidden}
        >
          {hidden ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
        <button
          type="button"
          className={`${ICON_BTN} md:!hidden`}
          aria-label="Exportar"
          onClick={handleExport}
        >
          <Download size={18} aria-hidden="true" />
        </button>
        <div className="hidden items-center gap-2 md:flex">
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

      {isMobile ? (
        // Celular: o que importa primeiro (patrimônio e mês), depois o que pede ação; o resto
        // vira atalho. Os gráficos ficam na tela de Análises.
        <div className="flex flex-col gap-3">
          {/* No celular a topbar some; o filtro PF / PJ fica no topo do Início. */}
          <ScopeSelector />
          <MonthStepper
            options={monthOptions}
            value={selectedMonth}
            onChange={setSelectedMonth}
            className="justify-between"
          />
          <MobileSummary
            status={summaryStatus}
            onRetry={() => void retryOverview()}
            monthName={selectedName}
            income={income}
            expenses={expenses}
            netWorth={netWorth}
            netWorthDelta={netWorthDelta}
            openCardDebt={parseFloat(overview?.openCardDebt ?? '0')}
            discountInvoices={discountInvoices}
            onToggleDiscountInvoices={toggleDiscountInvoices}
          />
          <NextDaysCard />
          <BudgetsCard key={`bud-${selectedMonth}`} month={selectedMonth} compactEmpty />
          <RecentTransactionsCard limit={4} />
          <MobileShortcuts
            investments={
              showInvestments
                ? {
                    gross: toNumber(investments.totalGross),
                    yieldMonth: parseFloat(overview?.investmentsYieldMonth ?? '0'),
                  }
                : undefined
            }
            goals={goals?.filter((g) => !g.archivedAt)}
          />
        </div>
      ) : (
        // Tablet: 2 colunas. Desktop: 12.
        <div className="flex flex-col gap-3 md:[display:grid] md:grid-cols-2 xl:grid-cols-12 xl:gap-4">
          <MonthSummary
            className="md:order-1 md:col-span-2 xl:col-span-12"
            status={summaryStatus}
            onRetry={() => void retryOverview()}
            monthName={selectedName}
            balance={income - expenses}
            income={income}
            expenses={expenses}
            incomeDelta={incomeDelta}
            expensesDelta={expensesDelta}
            netWorth={netWorth}
            netWorthDelta={netWorthDelta}
            openCardDebt={parseFloat(overview?.openCardDebt ?? '0')}
            discountInvoices={discountInvoices}
            onToggleDiscountInvoices={toggleDiscountInvoices}
          />

          {/* Logo abaixo do resumo em todo tamanho: mesma ordem do resumo, vem depois pelo DOM. */}
          <BalanceProjectionSection className="md:order-1 md:col-span-2 xl:col-span-8" />
          {/* Investimentos e metas lado a lado no tablet, empilhados ao lado da projeção no desktop. */}
          <div
            className={`flex flex-col gap-3 md:order-1 md:col-span-2 md:grid ${showInvestments ? 'md:grid-cols-2' : ''} xl:col-span-4 xl:flex xl:gap-4`}
          >
            {showInvestments && (
              <InvestmentsCard
                summary={investments}
                yieldMonth={parseFloat(overview?.investmentsYieldMonth ?? '0')}
              />
            )}
            <GoalsCard className={showInvestments ? '' : 'xl:flex-1'} />
          </div>

          <UpcomingBillsCard className="md:order-2 xl:order-5 xl:col-span-4" />
          <OpenInvoicesCard className="md:order-3 xl:order-4 xl:col-span-4" />
          {/* Antes das recentes no DOM: divide a mesma ordem com elas no tablet e no desktop. */}
          <BudgetsCard
            key={`bud-${selectedMonth}`}
            month={selectedMonth}
            className="md:order-7 md:col-span-2 xl:order-9 xl:col-span-8"
          />
          {/* Só tablet e desktop: no celular o card fica em /analises. O `max-md:hidden` cobre
              o primeiro quadro, antes de o `useMediaQuery` trocar para a variante do celular. */}
          <SubscriptionsCard className="max-md:hidden md:order-7 md:col-span-2 xl:order-9 xl:col-span-4" />
          <RecentTransactionsCard className="md:order-7 md:col-span-2 xl:order-9 xl:col-span-12" />

          <BarChartCard
            months={chartMonths}
            onMonthsChange={setChartMonths}
            className="md:order-4 md:col-span-2 xl:order-2 xl:col-span-8"
          />
          <CategoriesChartSection
            key={`cat-${selectedMonth}`}
            month={selectedMonth}
            className="md:order-5 xl:order-3 xl:col-span-4"
          />
          <NetWorthChartSection className="md:order-6 xl:order-7 xl:col-span-6" />
          <MonthComparisonSection
            key={`cmp-${selectedMonth}`}
            month={selectedMonth}
            className="md:order-8 xl:order-8 xl:col-span-6"
          />
          <LargestExpensesWidget className="md:order-9 xl:order-6 xl:col-span-4" />
        </div>
      )}

      <CreateTransactionDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
