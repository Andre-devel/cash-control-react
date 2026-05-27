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
import { useComparisonChart } from '@/features/dashboard/hooks/use-comparison-chart'

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getPreviousMonth(): string {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function fmt(v: number): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v)
}

function ChartSkeleton() {
  return (
    <div
      className="h-64 rounded bg-muted animate-pulse"
      aria-busy="true"
      aria-label="Loading comparison chart"
    />
  )
}

export function MonthComparisonSection() {
  const [month1, setMonth1] = useState(getPreviousMonth())
  const [month2, setMonth2] = useState(getCurrentMonth())

  const { data, isLoading, isError, refetch } = useComparisonChart({ month1, month2 })

  const chartData = data
    ? [
        {
          label: 'Income',
          [data.month1.month]: parseFloat(data.month1.income),
          [data.month2.month]: parseFloat(data.month2.income),
        },
        {
          label: 'Expenses',
          [data.month1.month]: parseFloat(data.month1.expenses),
          [data.month2.month]: parseFloat(data.month2.expenses),
        },
        {
          label: 'Balance',
          [data.month1.month]: parseFloat(data.month1.balance),
          [data.month2.month]: parseFloat(data.month2.balance),
        },
      ]
    : []

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Month Comparison</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="cmp-month1">
              Month 1
            </label>
            <input
              id="cmp-month1"
              type="month"
              value={month1}
              onChange={(e) => setMonth1(e.target.value)}
              className="rounded border border-input bg-background px-2 py-1 text-xs"
              aria-label="Month 1"
            />
            <span className="text-muted-foreground text-xs">vs</span>
            <label className="sr-only" htmlFor="cmp-month2">
              Month 2
            </label>
            <input
              id="cmp-month2"
              type="month"
              value={month2}
              onChange={(e) => setMonth2(e.target.value)}
              className="rounded border border-input bg-background px-2 py-1 text-xs"
              aria-label="Month 2"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ChartSkeleton />
        ) : isError ? (
          <div role="alert" className="space-y-2">
            <p className="text-sm text-destructive">Failed to load comparison chart.</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : !data ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No comparison data.</p>
        ) : (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v: number) =>
                    new Intl.NumberFormat(undefined, { notation: 'compact' }).format(v)
                  }
                />
                <Tooltip
                  formatter={(value) => {
                    const n = typeof value === 'number' ? value : parseFloat(String(value))
                    return isNaN(n) ? String(value) : fmt(n)
                  }}
                />
                <Legend />
                <Bar dataKey={data.month1.month} fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey={data.month2.month} fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {[data.month1, data.month2].map((m) => (
                <div key={m.month} className="space-y-1 rounded border p-3">
                  <p className="font-medium text-xs text-muted-foreground">{m.month}</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Income</span>
                    <span className="font-mono text-green-600 dark:text-green-400">
                      {fmt(parseFloat(m.income))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expenses</span>
                    <span className="font-mono text-destructive">
                      {fmt(parseFloat(m.expenses))}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="font-medium">Balance</span>
                    <span className="font-mono font-semibold">{fmt(parseFloat(m.balance))}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
