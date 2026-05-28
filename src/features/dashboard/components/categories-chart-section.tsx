import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { useCategoriesChart } from '@/features/dashboard/hooks/use-categories-chart'

const CAT_COLORS = [
  'var(--cat-1)',
  'var(--cat-2)',
  'var(--cat-3)',
  'var(--cat-4)',
  'var(--cat-5)',
  'var(--cat-6)',
  'var(--cat-7)',
  'var(--cat-8)',
]

function getDefaultRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return { from: fmt(from), to: fmt(to) }
}

function ChartSkeleton() {
  return (
    <div
      className="h-64 rounded animate-pulse"
      style={{ background: 'var(--surface-3)' }}
      aria-busy="true"
      aria-label="Loading categories chart"
    />
  )
}

export function CategoriesChartSection() {
  const defaults = getDefaultRange()
  const [from, setFrom] = useState(defaults.from)
  const [to, setTo] = useState(defaults.to)

  const { data, isLoading, isError, refetch } = useCategoriesChart({ from, to })

  return (
    <div className="card">
      <div className="card-h">
        <h3>Spending by Category</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="sr-only" htmlFor="cat-from">
            From
          </label>
          <input
            id="cat-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input"
            style={{ fontSize: 12, padding: '2px 8px', height: 'auto' }}
            aria-label="From date"
          />
          <span className="text-dim">–</span>
          <label className="sr-only" htmlFor="cat-to">
            To
          </label>
          <input
            id="cat-to"
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
              Failed to load categories chart.
            </p>
            <Button variant="ghost" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : !data || data.items.length === 0 ? (
          <p className="text-sm text-dim" style={{ padding: '32px 0', textAlign: 'center' }}>
            No expense data for the selected period.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data.items.map((item) => ({
                  name: item.categoryName ?? 'Uncategorized',
                  value: parseFloat(item.amount),
                }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {data.items.map((_, index) => (
                  <Cell key={index} fill={CAT_COLORS[index % CAT_COLORS.length]} />
                ))}
              </Pie>
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
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
