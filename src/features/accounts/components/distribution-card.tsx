import { Money } from '@/components/ui/money'
import { DonutChart } from './donut-chart'
import type { Account } from '@/features/accounts/types'

const ACCOUNT_TYPE_LABELS_PT: Record<string, string> = {
  CHECKING: 'Conta corrente',
  SAVINGS: 'Poupança',
  CASH: 'Carteira',
  INVESTMENT: 'Investimento',
  CREDIT: 'Crédito',
  OTHER: 'Outros',
}

interface DistributionCardProps {
  accounts: Account[]
  totalBalance: number
}

export function DistributionCard({ accounts, totalBalance }: DistributionCardProps) {
  const totalByType = accounts.reduce<Record<string, { value: number; color: string }>>(
    (acc, a) => {
      const balance = parseFloat(a.balance)
      if (balance <= 0) return acc
      if (!acc[a.type]) {
        acc[a.type] = { value: 0, color: a.color }
      }
      acc[a.type].value += balance
      return acc
    },
    {},
  )

  const segments = accounts
    .map((a) => ({ value: parseFloat(a.balance), color: a.color, label: a.name }))
    .filter((s) => s.value > 0)

  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Distribuição por tipo</h3>
          <div className="sub">Como seu patrimônio está alocado</div>
        </div>
      </div>
      <div className="card-b" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <DonutChart segments={segments} total={totalBalance} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(totalByType).map(([type, d]) => {
            const pct = totalBalance > 0 ? (d.value / totalBalance) * 100 : 0
            return (
              <div key={type} className="row gap-3" style={{ alignItems: 'center' }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: d.color,
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>
                  {ACCOUNT_TYPE_LABELS_PT[type] ?? type}
                </span>
                <span className="mono text-sm text-dim">{pct.toFixed(1)}%</span>
                <span className="mono text-sm fw-500" style={{ minWidth: 110, textAlign: 'right' }}>
                  <Money value={d.value} />
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
