import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useCategoriesChart } from '@/features/dashboard/hooks/use-categories-chart'
import { useHideValues } from '@/features/dashboard/hooks/use-hide-values'
import { HIDDEN_MONEY, monthRange, toYearMonth } from '@/features/dashboard/utils'
import { formatChartMoney, formatCompactNumber } from '@/lib/money'
import { Panel, PanelHeader, RangeDetails, SkeletonBlock, WidgetEmpty, WidgetError } from './panel'

const CAT_COLORS = Array.from({ length: 10 }, (_, i) => `var(--cat-${i + 1})`)

interface CategoriesChartSectionProps {
  /** Mês inicial (`aaaa-mm`); o período pode ser personalizado depois. */
  month?: string
  className?: string
}

export function CategoriesChartSection({ month, className = '' }: CategoriesChartSectionProps) {
  const defaults = monthRange(month ?? toYearMonth(new Date()))
  const [from, setFrom] = useState(defaults.from)
  const [to, setTo] = useState(defaults.to)
  const { hidden } = useHideValues()

  const { data, isLoading, isError, refetch } = useCategoriesChart({ from, to })

  const entries = (data?.entries ?? []).map((item, index) => ({
    name: item.categoryName ?? 'Sem categoria',
    value: parseFloat(item.totalAmount),
    pct: parseFloat(item.percentage),
    color: CAT_COLORS[index % CAT_COLORS.length] ?? 'var(--cat-10)',
  }))
  const total = data?.totalAmount
    ? parseFloat(data.totalAmount)
    : entries.reduce((sum, e) => sum + e.value, 0)

  return (
    <Panel className={className} label="Gastos por categoria">
      <PanelHeader title="Gastos por categoria" />
      <RangeDetails>
        <label className="flex items-center gap-2">
          <span className="text-fg-muted">De</span>
          <input
            id="cat-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input input-compact"
            aria-label="Data de início"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-fg-muted">até</span>
          <input
            id="cat-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input input-compact"
            aria-label="Data de fim"
          />
        </label>
      </RangeDetails>

      {isLoading ? (
        <div
          className="flex items-center gap-4"
          aria-busy="true"
          aria-label="Carregando gráfico de categorias"
        >
          <SkeletonBlock className="h-[120px] w-[120px] flex-none !rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonBlock key={i} className="h-3" />
            ))}
          </div>
        </div>
      ) : isError ? (
        <WidgetError
          message="Falha ao carregar gráfico de categorias."
          onRetry={() => void refetch()}
        />
      ) : entries.length === 0 ? (
        <WidgetEmpty>Nenhum dado de despesas para o período selecionado.</WidgetEmpty>
      ) : (
        <div className="flex flex-wrap items-center gap-4 xl:flex-col xl:items-stretch">
          <div className="relative h-[120px] w-[120px] flex-none xl:h-[150px] xl:w-[150px] xl:self-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={entries}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="72%"
                  outerRadius="100%"
                  paddingAngle={entries.length > 1 ? 1.5 : 0}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {entries.map((e) => (
                    <Cell key={e.name} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => (hidden ? HIDDEN_MONEY : formatChartMoney(v))}
                  contentStyle={{
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    color: 'var(--text)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
              <span className="text-overline uppercase text-fg-muted">Total</span>
              <span className="text-body-sm font-bold tabular-nums">
                {hidden ? '••••' : `R$ ${formatCompactNumber(total)}`}
              </span>
            </div>
          </div>
          <ul className="flex min-w-[150px] flex-1 flex-col gap-2" aria-label="Categorias">
            {entries.map((e) => (
              <li key={e.name} className="flex items-center gap-2 text-caption">
                <span
                  className="h-2 w-2 flex-none rounded-full"
                  style={{ background: e.color }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate">{e.name}</span>
                <span className="hidden tabular-nums text-fg-muted xl:inline">
                  {hidden ? '••••' : `R$ ${formatCompactNumber(e.value)}`}
                </span>
                <span className="w-10 text-right font-semibold tabular-nums">
                  {e.pct.toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}
