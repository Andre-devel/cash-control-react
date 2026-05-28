import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { useNetWorthChart } from '@/features/dashboard/hooks/use-net-worth-chart'

function getDefaultRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return { from: fmt(from), to: fmt(now) }
}

function ChartSkeleton() {
  return (
    <div
      className="h-64 rounded animate-pulse"
      style={{ background: 'var(--surface-3)' }}
      aria-busy="true"
      aria-label="Loading net worth chart"
    />
  )
}

export function NetWorthChartSection() {
  const defaults = getDefaultRange()
  const [from, setFrom] = useState(defaults.from)
  const [to, setTo] = useState(defaults.to)

  const { data, isLoading, isError, refetch } = useNetWorthChart({ from, to })

  return (
    <div className="card">
      <div className="card-h">
        <h3>Net Worth Evolution</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="sr-only" htmlFor="nw-from">
            From
          </label>
          <input
            id="nw-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input"
            style={{ fontSize: 12, padding: '2px 8px', height: 'auto' }}
            aria-label="From date"
          />
          <span className="text-dim">–</span>
          <label className="sr-only" htmlFor="nw-to">
            To
          </label>
          <input
            id="nw-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input"
            style={{ fontSize: 12, padding: '2px 8px', height: 'auto' }}
            aria-label="To date"
          />
        </div>
      </div>
      <div className="card-b">
        {isLoading ? (
          <ChartSkeleton />
        ) : isError ? (
          <div role="alert" className="space-y-2">
            <p className="text-sm" style={{ color: 'var(--expense)' }}>
              Failed to load net worth chart.
            </p>
            <Button variant="ghost" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : !data || data.data.length === 0 ? (
          <p className="text-sm text-dim" style={{ padding: '32px 0', textAlign: 'center' }}>
            No net worth data for the selected period.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={data.data.map((p) => ({
                date: p.date,
                'Net Worth': parseFloat(p.netWorth),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v: number) =>
                  new Intl.NumberFormat(undefined, { notation: 'compact' }).format(v)
                }
              />
              <Tooltip
                formatter={(value) => {
                  const n = typeof value === 'number' ? value : parseFloat(String(value))
                  return isNaN(n)
                    ? String(value)
                    : new Intl.NumberFormat(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(n)
                }}
              />
              <Line
                type="monotone"
                dataKey="Net Worth"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
