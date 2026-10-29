import { useState } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useNetWorthChart } from '@/features/dashboard/hooks/use-net-worth-chart'
import { useHideValues } from '@/features/dashboard/hooks/use-hide-values'
import { HIDDEN_MONEY } from '@/features/dashboard/utils'
import { formatLocalDate } from '@/lib/format-date'
import { formatChartMoney, formatCompactNumber, formatMoney } from '@/lib/money'
import { Panel, PanelHeader, RangeDetails, SkeletonBlock, WidgetEmpty, WidgetError } from './panel'

function getDefaultRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return { from: fmt(from), to: fmt(now) }
}

const AXIS_TICK = { fontSize: 11, fill: 'var(--text-muted)' }

export function NetWorthChartSection({ className = '' }: { className?: string }) {
  const defaults = getDefaultRange()
  const [from, setFrom] = useState(defaults.from)
  const [to, setTo] = useState(defaults.to)
  const { hidden } = useHideValues()

  const { data, isLoading, isError, refetch } = useNetWorthChart({ from, to })

  const points = (data?.snapshots ?? []).map((p) => ({
    date: p.date,
    Patrimônio: parseFloat(p.netWorth),
  }))
  const first = points[0]?.Patrimônio ?? 0
  const last = points[points.length - 1]?.Patrimônio ?? 0
  const change = last - first

  const changeBadge =
    points.length > 1 ? (
      <span
        className={`flex items-center gap-1 text-caption font-semibold ${
          change > 0 ? 'text-income' : change < 0 ? 'text-expense' : 'text-fg-muted'
        }`}
      >
        {change > 0 ? (
          <TrendingUp size={14} aria-hidden="true" />
        ) : change < 0 ? (
          <TrendingDown size={14} aria-hidden="true" />
        ) : null}
        {hidden
          ? HIDDEN_MONEY
          : `${change > 0 ? '+' : change < 0 ? '−' : ''}${formatMoney(Math.abs(change))}`}{' '}
        no período
      </span>
    ) : undefined

  return (
    <Panel className={className} label="Evolução do patrimônio">
      <PanelHeader title="Evolução do patrimônio" right={changeBadge} />
      <RangeDetails>
        <label className="flex items-center gap-2">
          <span className="text-fg-muted">De</span>
          <input
            id="nw-from"
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
            id="nw-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input input-compact"
            aria-label="Data de fim"
          />
        </label>
      </RangeDetails>

      {isLoading ? (
        <div aria-busy="true" aria-label="Carregando gráfico de patrimônio">
          <SkeletonBlock className="h-[180px]" />
        </div>
      ) : isError ? (
        <WidgetError
          message="Falha ao carregar gráfico de patrimônio."
          onRetry={() => void refetch()}
        />
      ) : points.length === 0 ? (
        <WidgetEmpty>Nenhum dado de patrimônio para o período selecionado.</WidgetEmpty>
      ) : (
        <>
          <div className="h-[180px] md:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="dash-networth-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatLocalDate}
                  minTickGap={24}
                />
                <YAxis
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={false}
                  width={hidden ? 8 : 60}
                  tickFormatter={(v: number) => (hidden ? '' : formatCompactNumber(v))}
                />
                <Tooltip
                  labelFormatter={(label) => formatLocalDate(String(label))}
                  formatter={(v) => (hidden ? HIDDEN_MONEY : formatChartMoney(v))}
                  contentStyle={{
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    color: 'var(--text)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Patrimônio"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  fill="url(#dash-networth-fill)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <table className="sr-only">
            <caption>Patrimônio por data</caption>
            <tbody>
              {points.map((p) => (
                <tr key={p.date}>
                  <th scope="row">{formatLocalDate(p.date)}</th>
                  <td>{hidden ? 'Valor oculto' : formatMoney(p.Patrimônio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </Panel>
  )
}
