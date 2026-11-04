import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { ROUTES } from '@/app/router/routes'
import { localIsoDate } from '@/lib'
import { BarChartCard } from '@/features/dashboard/components/bar-chart-card'
import { CategoriesChartSection } from '@/features/dashboard/components/categories-chart-section'
import { NetWorthChartSection } from '@/features/dashboard/components/net-worth-chart-section'
import { LargestExpensesWidget } from '@/features/dashboard/components/largest-expenses-widget'
import { SubscriptionsCard } from '@/features/dashboard/components/subscriptions-card'

const PERIODS = [3, 6, 12] as const

/** Do dia 1 do mês de `months − 1` meses atrás até hoje: os mesmos meses das barras. */
function periodRange(months: number, today = new Date()) {
  const from = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1)
  return { from: localIsoDate(from), to: localIsoDate(today) }
}

/**
 * Os gráficos do dashboard numa tela própria, com um período só para todos. No celular eles
 * saíram do Início; no tablet/desktop continuam também na grade do dashboard.
 */
export default function AnalyticsPage() {
  const [months, setMonths] = useState<number>(6)
  const range = periodRange(months)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3 md:gap-4">
      <div className="flex items-center gap-2">
        <Link
          to={ROUTES.DASHBOARD}
          aria-label="Voltar para o início"
          className="btn btn-icon min-h-touch min-w-touch rounded-lg border border-border bg-surface-1 text-fg"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </Link>
        <h1 className="font-display text-h1">Análises</h1>
      </div>

      <div
        role="tablist"
        aria-label="Período das análises"
        className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface-1 p-1"
      >
        {PERIODS.map((option) => {
          const on = months === option
          return (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setMonths(option)}
              className={`min-h-[40px] rounded-lg text-body-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus ${
                on ? 'bg-surface-3 text-fg' : 'text-fg-muted'
              }`}
            >
              {option} meses
            </button>
          )
        })}
      </div>

      <BarChartCard months={months} />
      <CategoriesChartSection range={range} />
      <NetWorthChartSection range={range} />
      <LargestExpensesWidget range={range} />
      {/* No celular o Início não mostra este card; aqui ele fica junto das análises. */}
      <SubscriptionsCard />
    </div>
  )
}
