import { useState } from 'react'
import { CircleAlert } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useBalanceProjection } from '@/features/dashboard/hooks/use-balance-projection'
import { useHideValues } from '@/features/dashboard/hooks/use-hide-values'
import { HIDDEN_MONEY } from '@/features/dashboard/utils'
import { formatShortDate } from '@/lib/format-date'
import { formatChartMoney, formatCompactNumber, formatMoney } from '@/lib/money'
import { Amount } from './amount'
import { Panel, PanelHeader, SkeletonBlock, WidgetError } from './panel'

const DAY_OPTIONS = [30, 60, 90] as const
const EVENTS_PREVIEW = 5
const AXIS_TICK = { fontSize: 11, fill: 'var(--text-muted)' }

interface StatProps {
  label: string
  value: number
  negative?: boolean
}

function Stat({ label, value, negative = false }: StatProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="truncate text-caption text-fg-muted">{label}</span>
      <Amount
        value={value}
        className={`font-display text-[17px] font-bold leading-none ${negative ? 'text-expense' : 'text-fg'}`}
      />
    </div>
  )
}

/**
 * Saldo previsto das contas ativas com o que já está lançado: pendências na data prevista,
 * faturas no vencimento e recorrências futuras (estimadas). Gasto não lançado não entra.
 */
export function BalanceProjectionSection({ className = '' }: { className?: string }) {
  const [days, setDays] = useState<number>(DAY_OPTIONS[0])
  const [showAll, setShowAll] = useState(false)
  const { hidden } = useHideValues()
  const { data, isLoading, isError, refetch } = useBalanceProjection(days)

  const points = (data?.points ?? []).map((p) => ({ date: p.date, Saldo: Number(p.balance) }))
  const events = data?.events ?? []
  const visibleEvents = showAll ? events : events.slice(0, EVENTS_PREVIEW)
  const lowest = Number(data?.lowest.balance ?? 0)
  const goesNegative = data?.firstNegativeDate != null
  const lineColor = goesNegative ? 'var(--expense)' : 'var(--accent)'

  return (
    <Panel className={className} label="Projeção de saldo">
      <PanelHeader
        title="Projeção de saldo"
        sub={`Próximos ${days} dias, com o que já está lançado`}
        right={
          <div
            className="flex rounded-lg bg-surface-2 p-[3px]"
            role="tablist"
            aria-label="Horizonte da projeção"
          >
            {DAY_OPTIONS.map((option) => {
              const on = days === option
              return (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => {
                    setShowAll(false)
                    setDays(option)
                  }}
                  className={`min-h-[36px] rounded-md px-3 text-caption font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus ${
                    on ? 'bg-surface-3 text-fg' : 'text-fg-muted'
                  }`}
                >
                  {option}d
                </button>
              )
            })}
          </div>
        }
      />

      {isLoading ? (
        <div aria-busy="true" aria-label="Carregando projeção de saldo">
          <SkeletonBlock className="mb-3 h-10" />
          <SkeletonBlock className="h-[160px]" />
        </div>
      ) : isError || !data ? (
        <WidgetError
          message="Falha ao carregar projeção de saldo."
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          <div className="mb-3 grid grid-cols-3 gap-3">
            <Stat label="Hoje" value={Number(data.startBalance)} />
            <Stat
              label={`Em ${formatShortDate(data.to)}`}
              value={Number(data.endBalance)}
              negative={Number(data.endBalance) < 0}
            />
            <Stat
              label={`Menor · ${formatShortDate(data.lowest.date)}`}
              value={lowest}
              negative={lowest < 0}
            />
          </div>

          {goesNegative && (
            <p
              role="status"
              className="mb-3 flex items-center gap-2 rounded-lg bg-expense-soft px-3 py-2 text-body-sm font-semibold text-expense"
            >
              <CircleAlert size={16} aria-hidden="true" />
              Saldo fica negativo em {formatShortDate(data.firstNegativeDate)}
            </p>
          )}

          <div className="h-[160px] md:h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="dash-projection-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={lineColor} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatShortDate}
                  minTickGap={24}
                />
                <YAxis
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={false}
                  width={hidden ? 8 : 60}
                  tickFormatter={(v: number) => (hidden ? '' : formatCompactNumber(v))}
                />
                {goesNegative && (
                  <ReferenceLine y={0} stroke="var(--expense)" strokeDasharray="4 4" />
                )}
                <Tooltip
                  labelFormatter={(label) => formatShortDate(String(label))}
                  formatter={(v) => (hidden ? HIDDEN_MONEY : formatChartMoney(v))}
                  contentStyle={{
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    color: 'var(--text)',
                  }}
                />
                <Area
                  type="stepAfter"
                  dataKey="Saldo"
                  stroke={lineColor}
                  strokeWidth={2.5}
                  fill="url(#dash-projection-fill)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <table className="sr-only">
            <caption>Saldo previsto por data</caption>
            <tbody>
              {points.map((p) => (
                <tr key={p.date}>
                  <th scope="row">{formatShortDate(p.date)}</th>
                  <td>{hidden ? 'Valor oculto' : formatMoney(p.Saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {events.length === 0 ? (
            <p className="mt-3 text-body-sm text-fg-muted">
              Nada pendente nos próximos {days} dias.
            </p>
          ) : (
            <>
              <h3 className="mb-1 mt-4 text-caption font-semibold text-fg-muted">
                O que mexe no saldo
              </h3>
              <ul className="flex flex-col">
                {visibleEvents.map((event, i) => (
                  <li
                    key={`${event.date}-${event.kind}-${i}`}
                    className="flex min-h-[44px] items-center gap-3 border-b border-border py-1.5 last:border-b-0"
                  >
                    <span className="w-12 flex-none text-caption tabular-nums text-fg-muted">
                      {formatShortDate(event.date)}
                    </span>
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="truncate text-body-sm">{event.description}</span>
                      {event.estimated && <span className="badge muted">estimado</span>}
                    </span>
                    <Amount
                      value={Number(event.amount)}
                      signed
                      className={`text-body-sm font-semibold ${
                        Number(event.amount) > 0 ? 'text-income' : 'text-fg'
                      }`}
                    />
                  </li>
                ))}
              </ul>
              {events.length > EVENTS_PREVIEW && (
                <button
                  type="button"
                  onClick={() => setShowAll((v) => !v)}
                  className="mt-1 inline-flex min-h-touch items-center self-start rounded-md px-1 text-body-sm font-semibold text-brand-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
                >
                  {showAll ? 'Mostrar menos' : `Ver todos (${events.length})`}
                </button>
              )}
            </>
          )}

          <p className="mt-3 text-caption text-fg-muted">Não inclui gastos ainda não lançados.</p>
        </>
      )}
    </Panel>
  )
}
