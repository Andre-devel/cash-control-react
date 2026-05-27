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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useMonthlyChart } from '@/features/dashboard/hooks/use-monthly-chart'

const MONTH_OPTIONS = [3, 6, 12]

function ChartSkeleton() {
  return (
    <div
      className="h-64 rounded bg-muted animate-pulse"
      aria-busy="true"
      aria-label="Loading monthly chart"
    />
  )
}

export function MonthlyChartSection() {
  const [months, setMonths] = useState(6)
  const { data, isLoading, isError, refetch } = useMonthlyChart(months)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Monthly Income vs Expenses</CardTitle>
          <div className="flex gap-1" role="group" aria-label="Select number of months">
            {MONTH_OPTIONS.map((m) => (
              <Button
                key={m}
                variant={months === m ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMonths(m)}
                aria-pressed={months === m}
              >
                {m}m
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ChartSkeleton />
        ) : isError ? (
          <div role="alert" className="space-y-2">
            <p className="text-sm text-destructive">Failed to load monthly chart.</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : !data || data.entries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
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
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
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
              <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
