import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { useMonthlyChart } from '@/features/dashboard/hooks/use-monthly-chart'

const MONTH_OPTIONS = [3, 6, 12]

function ChartSkeleton() {
  return (
    <div
      className="h-64 rounded animate-pulse"
      style={{ background: 'var(--surface-3)' }}
      aria-busy="true"
      aria-label="Loading monthly chart"
    />
  )
}

export function MonthlyChartSection() {
  const [months, setMonths] = useState(6)
  const { data, isLoading, isError, refetch } = useMonthlyChart(months)

  return (
    <div className="card">
      <div className="card-h">
        <h3>Monthly Income vs Expenses</h3>
        <div className="flex gap-1" role="group" aria-label="Select number of months">
          {MONTH_OPTIONS.map((m) => (
            <Button
              key={m}
              variant={months === m ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setMonths(m)}
              aria-pressed={months === m}
            >
              {m}m
            </Button>
          ))}
        </div>
      </div>
      <div className="card-b">
        {isLoading ? (
          <ChartSkeleton />
        ) : isError ? (
          <div role="alert" className="space-y-2">
            <p className="text-sm" style={{ color: 'var(--expense)' }}>
              Failed to load monthly chart.
            </p>
            <Button variant="ghost" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : !data || data.entries.length === 0 ? (
          <p className="text-sm text-dim" style={{ padding: '32px 0', textAlign: 'center' }}>
            No data available for the selected period.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data.entries.map((e) => ({
                month: e.month,
                Income: parseFloat(e.income),
                Expenses: parseFloat(e.expenses),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
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
              <Legend />
              <Bar dataKey="Income" fill="var(--income)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="var(--expense)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
