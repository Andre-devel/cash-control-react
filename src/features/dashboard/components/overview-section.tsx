import { Card, CardContent } from '@/components/ui/card'
import { useOverview } from '@/features/dashboard/hooks/use-overview'

function fmt(amount: string): string {
  const n = parseFloat(amount)
  if (isNaN(n)) return amount
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function OverviewSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      aria-busy="true"
      aria-label="Loading overview"
    >
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="p-4 animate-pulse space-y-2">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-6 w-32 rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function OverviewError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="space-y-2">
      <p className="text-sm text-destructive">Failed to load financial overview.</p>
      <button
        type="button"
        className="text-sm underline text-muted-foreground hover:text-foreground"
        onClick={onRetry}
      >
        Retry
      </button>
    </div>
  )
}

export function OverviewSection() {
  const { data, isLoading, isError, refetch } = useOverview()

  if (isLoading) return <OverviewSkeleton />
  if (isError) return <OverviewError onRetry={() => void refetch()} />
  if (!data) return null

  const stats = [
    { label: 'Total Balance', value: fmt(data.totalBalance), mono: true },
    { label: 'Monthly Income', value: fmt(data.monthlyIncome), mono: true },
    { label: 'Monthly Expenses', value: fmt(data.monthlyExpenses), mono: true },
    { label: 'Active Accounts', value: String(data.activeAccountsCount), mono: false },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-xl font-bold tracking-tight ${s.mono ? 'font-mono' : ''}`}>
              {s.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
