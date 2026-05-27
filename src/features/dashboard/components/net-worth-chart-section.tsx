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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      className="h-64 rounded bg-muted animate-pulse"
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
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Net Worth Evolution</CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <label className="sr-only" htmlFor="nw-from">
              From
            </label>
            <input
              id="nw-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded border border-input bg-background px-2 py-1 text-xs"
              aria-label="From date"
            />
            <span className="text-muted-foreground">–</span>
            <label className="sr-only" htmlFor="nw-to">
              To
            </label>
            <input
              id="nw-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded border border-input bg-background px-2 py-1 text-xs"
              aria-label="To date"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ChartSkeleton />
        ) : isError ? (
          <div role="alert" className="space-y-2">
            <p className="text-sm text-destructive">Failed to load net worth chart.</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : !data || data.data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
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
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
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
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
