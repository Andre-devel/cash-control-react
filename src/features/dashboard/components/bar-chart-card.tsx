import { useState } from 'react'
import { useMonthlyChart } from '@/features/dashboard/hooks/use-monthly-chart'
import { useHideValues } from '@/features/dashboard/hooks/use-hide-values'
import { HIDDEN_MONEY, monthAbbr } from '@/features/dashboard/utils'
import { formatMoney } from '@/lib/money'
import { Panel, PanelHeader, SkeletonBlock, WidgetEmpty, WidgetError } from './panel'

/** Janelas do gráfico. Os cards de resumo seguem o mês escolhido no topo. */
const MONTH_OPTIONS = [3, 6, 12] as const

interface BarChartCardProps {
  months?: number
  onMonthsChange?: (months: number) => void
  className?: string
}

export function BarChartCard({ months = 6, onMonthsChange, className = '' }: BarChartCardProps) {
  const { data, isLoading, isError, refetch } = useMonthlyChart(months)
  const { hidden } = useHideValues()
  const [picked, setPicked] = useState<number | null>(null)

  const parsed = (data?.months ?? []).map((e) => ({
    key: e.month,
    label: monthAbbr(e.month),
    income: parseFloat(e.income),
    expense: parseFloat(e.expenses),
  }))
  const max = Math.max(1, ...parsed.flatMap((d) => [d.income, d.expense]))
  const lastIndex = parsed.length - 1
  const selected = picked !== null && picked <= lastIndex ? picked : lastIndex
  const current = parsed[selected]
  const money = (v: number) => (hidden ? HIDDEN_MONEY : formatMoney(v))

  return (
    <Panel className={className} label="Receitas vs Despesas">
      <PanelHeader
        title="Receitas vs Despesas"
        sub={`Últimos ${months} meses · toque numa barra para ver os valores`}
        right={
          onMonthsChange && (
            <div
              className="flex rounded-lg bg-surface-2 p-[3px]"
              role="tablist"
              aria-label="Período do gráfico"
            >
              {MONTH_OPTIONS.map((option) => {
                const on = months === option
                return (
                  <button
                    key={option}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => {
                      setPicked(null)
                      onMonthsChange(option)
                    }}
                    className={`min-h-[36px] rounded-md px-3 text-caption font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus ${
                      on ? 'bg-surface-3 text-fg' : 'text-fg-muted'
                    }`}
                  >
                    {option}m
                  </button>
                )
              })}
            </div>
          )
        }
      />

      <div className="mb-3 flex gap-4 text-caption text-fg-muted" aria-hidden="true">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs bg-income" />
          Receitas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs bg-expense" />
          Despesas
        </span>
      </div>

      {isLoading ? (
        <SkeletonBlock className="h-[188px] md:h-[228px]" />
      ) : isError ? (
        <WidgetError message="Erro ao carregar gráfico." onRetry={() => void refetch()} />
      ) : parsed.length === 0 ? (
        <WidgetEmpty>Sem dados disponíveis.</WidgetEmpty>
      ) : (
        <>
          {current && (
            <p
              className="mb-2 self-start rounded-md bg-fg px-2.5 py-1.5 text-caption font-medium tabular-nums text-bg"
              aria-live="polite"
            >
              <b>{current.label}</b> · + {money(current.income)} · − {money(current.expense)}
            </p>
          )}
          <div
            className="flex h-[150px] items-end gap-1 border-b border-border md:h-[190px] md:gap-2"
            aria-hidden="true"
          >
            {parsed.map((d, i) => {
              const on = i === selected
              return (
                <button
                  key={d.key}
                  type="button"
                  tabIndex={-1}
                  onClick={() => setPicked(i)}
                  className={`flex h-full min-w-0 flex-1 items-end justify-center gap-[3px] rounded-t-md transition-opacity ${
                    on ? 'bg-fg/5 opacity-100' : 'opacity-50'
                  }`}
                >
                  <span
                    className="w-[30%] max-w-[18px] rounded-t-[5px] bg-income"
                    style={{ height: `${(d.income / max) * 100}%` }}
                  />
                  <span
                    className="w-[30%] max-w-[18px] rounded-t-[5px] bg-expense"
                    style={{ height: `${(d.expense / max) * 100}%` }}
                  />
                </button>
              )
            })}
          </div>
          <div
            className="mt-1.5 flex gap-1 md:gap-2"
            role="group"
            aria-label="Escolher mês do gráfico"
          >
            {parsed.map((d, i) => (
              <button
                key={d.key}
                type="button"
                aria-pressed={i === selected}
                aria-label={`${d.label}: receitas ${money(d.income)}, despesas ${money(d.expense)}`}
                onClick={() => setPicked(i)}
                className={`min-h-touch min-w-0 flex-1 rounded-md text-caption focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus ${
                  i === selected ? 'font-semibold text-fg' : 'text-fg-muted'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <table className="sr-only">
            <caption>Receitas e despesas por mês</caption>
            <thead>
              <tr>
                <th scope="col">Mês</th>
                <th scope="col">Receitas</th>
                <th scope="col">Despesas</th>
              </tr>
            </thead>
            <tbody>
              {parsed.map((d) => (
                <tr key={d.key}>
                  <th scope="row">{d.key}</th>
                  <td>{money(d.income)}</td>
                  <td>{money(d.expense)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </Panel>
  )
}
