import { useState } from 'react'
import { useComparisonChart } from '@/features/dashboard/hooks/use-comparison-chart'
import { useHideValues } from '@/features/dashboard/hooks/use-hide-values'
import { HIDDEN_MONEY, shiftYearMonth, toYearMonth } from '@/features/dashboard/utils'
import { formatYearMonth } from '@/lib/format-date'
import { formatMoney } from '@/lib/money'
import { Panel, PanelHeader, SkeletonBlock, WidgetEmpty, WidgetError } from './panel'

interface MonthComparisonSectionProps {
  /** Mês comparado (`aaaa-mm`) — o outro é o anterior a ele. */
  month?: string
  className?: string
}

interface Row {
  name: string
  a: number
  b: number
  /** Cor da barra do segundo mês. */
  barClass: string
  /** Para despesas, subir é ruim. */
  higherIsBetter: boolean
}

function deltaOf(a: number, b: number) {
  if (a === 0) return null
  return ((b - a) / Math.abs(a)) * 100
}

export function MonthComparisonSection({ month, className = '' }: MonthComparisonSectionProps) {
  const base = month ?? toYearMonth(new Date())
  const [month1, setMonth1] = useState(shiftYearMonth(base, -1))
  const [month2, setMonth2] = useState(base)
  const { hidden } = useHideValues()

  const { data, isLoading, isError, refetch } = useComparisonChart({ month1, month2 })

  const rows: Row[] = data
    ? [
        {
          name: 'Receitas',
          a: parseFloat(data.month1.income),
          b: parseFloat(data.month2.income),
          barClass: 'bg-income',
          higherIsBetter: true,
        },
        {
          name: 'Despesas',
          a: parseFloat(data.month1.expenses),
          b: parseFloat(data.month2.expenses),
          barClass: 'bg-expense',
          higherIsBetter: false,
        },
        {
          name: 'Saldo',
          a: parseFloat(data.month1.savings),
          b: parseFloat(data.month2.savings),
          barClass: 'bg-brand',
          higherIsBetter: true,
        },
      ]
    : []
  const max = Math.max(1, ...rows.flatMap((r) => [Math.abs(r.a), Math.abs(r.b)]))
  const money = (v: number) => (hidden ? HIDDEN_MONEY : formatMoney(v))

  return (
    <Panel className={className} label="Comparação mensal">
      <PanelHeader
        title="Comparação mensal"
        right={
          <div className="flex flex-wrap items-center gap-1.5 text-body-sm">
            <label className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-xs bg-fg-subtle" aria-hidden="true" />
              <span className="sr-only">Mês 1</span>
              <input
                id="cmp-month1"
                type="month"
                value={month1}
                onChange={(e) => setMonth1(e.target.value)}
                className="input input-compact"
                aria-label="Mês 1"
              />
            </label>
            <span className="text-fg-muted" aria-hidden="true">
              ×
            </span>
            <label className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-xs bg-brand" aria-hidden="true" />
              <span className="sr-only">Mês 2</span>
              <input
                id="cmp-month2"
                type="month"
                value={month2}
                onChange={(e) => setMonth2(e.target.value)}
                className="input input-compact"
                aria-label="Mês 2"
              />
            </label>
          </div>
        }
      />

      {isLoading ? (
        <div
          className="flex flex-col gap-4"
          aria-busy="true"
          aria-label="Carregando gráfico de comparação"
        >
          {[1, 2, 3].map((i) => (
            <SkeletonBlock key={i} className="h-10" />
          ))}
        </div>
      ) : isError ? (
        <WidgetError
          message="Falha ao carregar gráfico de comparação."
          onRetry={() => void refetch()}
        />
      ) : !data ? (
        <WidgetEmpty>Nenhum dado de comparação.</WidgetEmpty>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((r) => {
            const d = deltaOf(r.a, r.b)
            const good = d !== null && (r.higherIsBetter ? d > 0 : d < 0)
            const deltaClass =
              d === null || Math.round(d) === 0
                ? 'text-fg-muted'
                : good
                  ? 'text-income'
                  : 'text-expense'
            return (
              <li key={r.name} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2 text-body-sm">
                  <span className="font-medium">{r.name}</span>
                  <span className={`text-caption font-semibold tabular-nums ${deltaClass}`}>
                    {d === null
                      ? '—'
                      : `${d > 0 ? '+' : d < 0 ? '−' : ''}${Math.abs(d).toFixed(0)}%`}
                  </span>
                </div>
                <div className="[display:grid] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
                  <span
                    className="h-[7px] rounded-xs bg-fg-subtle"
                    style={{ width: `${(Math.abs(r.a) / max) * 100}%` }}
                    aria-hidden="true"
                  />
                  <span className="text-caption tabular-nums text-fg-muted">
                    <span className="sr-only">{formatYearMonth(data.month1.month)}: </span>
                    {money(r.a)}
                  </span>
                  <span
                    className={`h-[7px] rounded-xs ${r.b < 0 ? 'bg-expense' : r.barClass}`}
                    style={{ width: `${(Math.abs(r.b) / max) * 100}%` }}
                    aria-hidden="true"
                  />
                  <span className="text-caption font-semibold tabular-nums">
                    <span className="sr-only">{formatYearMonth(data.month2.month)}: </span>
                    {money(r.b)}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
