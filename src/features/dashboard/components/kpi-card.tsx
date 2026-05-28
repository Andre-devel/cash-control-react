import type { ComponentType } from 'react'
import type { LucideProps } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

type DeltaKind = 'up' | 'down' | 'neutral'

interface KpiCardProps {
  label: string
  icon: ComponentType<LucideProps>
  value: number
  delta?: string
  deltaKind?: DeltaKind
  tone?: 'income' | 'expense'
  signed?: boolean
}

export function KpiCard({
  label,
  icon: Icon,
  value,
  delta,
  deltaKind = 'neutral',
  tone,
  signed = false,
}: KpiCardProps) {
  const abs = Math.abs(value)
  const [intStr, decStr] = abs.toFixed(2).split('.')
  const intGrouped = (intStr ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  let displaySign = ''
  if (signed) {
    displaySign = value > 0 ? '+' : value < 0 ? '−' : ''
  } else if (value < 0) {
    displaySign = '-'
  }

  const valueColor =
    tone === 'income' ? 'var(--income)' : tone === 'expense' ? 'var(--expense)' : 'var(--text)'

  return (
    <div className="kpi">
      <div className="label">
        <Icon size={13} />
        {label}
      </div>
      <div className="value" style={{ color: valueColor }}>
        <span style={{ color: 'var(--text-dim)', fontSize: '0.65em', marginRight: 4 }}>R$</span>
        {displaySign}
        {intGrouped}
        <span className="cents">,{decStr ?? '00'}</span>
      </div>
      {delta && (
        <div className={`delta ${deltaKind}`}>
          {deltaKind === 'up' && <TrendingUp size={11} />}
          {deltaKind === 'down' && <TrendingDown size={11} />}
          {delta}
        </div>
      )}
    </div>
  )
}
