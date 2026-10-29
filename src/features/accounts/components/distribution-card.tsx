import { formatMoney } from '@/lib/money'
import { DonutChart } from './donut-chart'
import { accountTypeColor, accountTypeLabel } from '@/features/accounts/utils/account-visual'
import type { Account } from '@/features/accounts/types'

interface DistributionCardProps {
  accounts: Account[]
  totalBalance: number
}

export function DistributionCard({ accounts, totalBalance }: DistributionCardProps) {
  // Só saldo positivo entra no gráfico: conta negativa não "ocupa" fatia do patrimônio.
  const totalByType = accounts.reduce<Record<string, number>>((acc, a) => {
    const balance = parseFloat(a.balance)
    if (balance <= 0) return acc
    acc[a.type] = (acc[a.type] ?? 0) + balance
    return acc
  }, {})

  const entries = Object.entries(totalByType)
  const segments = entries.map(([type, value]) => ({
    value,
    color: accountTypeColor(type),
    label: accountTypeLabel(type),
  }))

  return (
    <section
      className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-surface-1 p-4 md:p-5"
      aria-labelledby="accounts-distribution-title"
    >
      <div className="flex flex-col gap-0.5">
        <h2 id="accounts-distribution-title" className="font-display text-h2 text-fg">
          Distribuição por tipo
        </h2>
        <p className="text-body-sm text-fg-muted">Como seu patrimônio está alocado</p>
      </div>
      <div className="flex flex-wrap items-center gap-5">
        <DonutChart segments={segments} total={totalBalance} size={128} />
        <ul className="m-0 flex min-w-[200px] flex-1 list-none flex-col gap-2.5 p-0">
          {entries.map(([type, value]) => {
            const pct = totalBalance > 0 ? (value / totalBalance) * 100 : 0
            return (
              <li key={type} className="flex items-center gap-2 text-body-sm">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: accountTypeColor(type) }}
                />
                <span className="min-w-0 flex-1 truncate text-fg">{accountTypeLabel(type)}</span>
                <span className="shrink-0 tabular-nums text-fg-muted">
                  {pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
                </span>
                <span className="shrink-0 whitespace-nowrap text-right font-semibold tabular-nums text-fg">
                  {formatMoney(value)}
                </span>
              </li>
            )
          })}
          {entries.length === 0 && (
            <li className="text-body-sm text-fg-muted">Nenhuma conta com saldo positivo.</li>
          )}
        </ul>
      </div>
    </section>
  )
}
