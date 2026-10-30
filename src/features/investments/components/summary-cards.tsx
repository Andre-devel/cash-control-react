import type { ReactNode } from 'react'
import { Money } from '@/components/ui/money'
import type { InvestmentSummary } from '@/features/investments/types'
import { formatPercent, toNumber } from '@/features/investments/utils/labels'

function Stat({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-2xl border border-border bg-surface-1 p-4">
      <span className="text-caption text-fg-muted">{label}</span>
      <span className="font-display text-[20px] font-bold leading-tight text-fg tabular-nums">
        {children}
      </span>
      {hint && <span className="text-caption text-fg-muted">{hint}</span>}
    </div>
  )
}

export function SummaryCards({ summary }: { summary: InvestmentSummary }) {
  const principal = toNumber(summary.totalPrincipal)
  const yieldValue = toNumber(summary.totalYield)
  const yieldPercent = principal > 0 ? (yieldValue / principal) * 100 : 0
  const taxes = toNumber(summary.totalIncomeTax) + toNumber(summary.totalIof)

  return (
    <div className="grid grid-cols-2 gap-2 md:gap-3 xl:grid-cols-4">
      <Stat label="Valor bruto" hint={summary.estimated ? 'inclui estimativa' : undefined}>
        <Money value={toNumber(summary.totalGross)} />
      </Stat>
      <Stat
        label="Líquido se resgatar hoje"
        hint={
          <>
            impostos <Money value={taxes} />
          </>
        }
      >
        <Money value={toNumber(summary.totalNet)} />
      </Stat>
      <Stat label="Rendimento" hint={formatPercent(yieldPercent)}>
        <span className={yieldValue < 0 ? 'text-expense' : 'text-income'}>
          <Money value={yieldValue} signed />
        </span>
      </Stat>
      <Stat label="Aplicado">
        <Money value={principal} />
      </Stat>
    </div>
  )
}
