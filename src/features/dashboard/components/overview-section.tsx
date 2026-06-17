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
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Carregando visão geral"
    >
      {[1, 2, 3].map((i) => (
        <div key={i} className="card">
          <div className="card-b animate-pulse space-y-2">
            <div className="h-3 w-24 rounded" style={{ background: 'var(--surface-3)' }} />
            <div className="h-6 w-32 rounded" style={{ background: 'var(--surface-3)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function OverviewError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="space-y-2">
      <p className="text-sm" style={{ color: 'var(--expense)' }}>
        Falha ao carregar visão geral.
      </p>
      <button type="button" className="text-sm underline text-dim" onClick={onRetry}>
        Tentar novamente
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
    { label: 'Saldo total', value: fmt(data.totalBalance), mono: true },
    { label: 'Receita mensal', value: fmt(data.monthlyIncome), mono: true },
    { label: 'Despesas mensais', value: fmt(data.monthlyExpenses), mono: true },
    ...(data.cashFlow !== undefined
      ? [{ label: 'Fluxo de caixa', value: fmt(data.cashFlow), mono: true }]
      : []),
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((s) => (
        <div key={s.label} className="card">
          <div className="card-b space-y-1">
            <p className="text-xs text-dim">{s.label}</p>
            <p
              className={`fw-700${s.mono ? ' mono' : ''}`}
              style={{ fontSize: 20, letterSpacing: '-0.02em' }}
            >
              {s.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
