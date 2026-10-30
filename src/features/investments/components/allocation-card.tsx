import { useState } from 'react'
import { Panel, PanelHeader } from '@/features/dashboard/components/panel'
import { DonutChart } from '@/features/accounts/components/donut-chart'
import { Money } from '@/components/ui/money'
import { Segmented } from './segmented'
import type { InvestmentSummary } from '@/features/investments/types'
import {
  ALLOCATION_COLORS,
  ALLOCATION_LABELS,
  formatPercent,
  toNumber,
} from '@/features/investments/utils/labels'

type View = 'byKind' | 'byIndexer' | 'byMaturity'

const VIEWS: { id: View; label: string }[] = [
  { id: 'byKind', label: 'Tipo' },
  { id: 'byIndexer', label: 'Indexador' },
  { id: 'byMaturity', label: 'Prazo' },
]

export function AllocationCard({ summary }: { summary: InvestmentSummary }) {
  const [view, setView] = useState<View>('byKind')
  const slices = summary[view]
  const total = toNumber(summary.totalGross)
  const segments = slices.map((slice, i) => ({
    value: toNumber(slice.gross),
    color: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length],
    label: ALLOCATION_LABELS[slice.key] ?? slice.key,
  }))

  return (
    <Panel label="Alocação">
      <PanelHeader
        title="Alocação"
        right={
          <Segmented label="Agrupar alocação por" options={VIEWS} value={view} onChange={setView} />
        }
      />
      <div className="flex flex-wrap items-center gap-5">
        <DonutChart segments={segments} total={total} size={128} />
        <ul className="m-0 flex min-w-[200px] flex-1 list-none flex-col gap-2.5 p-0">
          {slices.map((slice, i) => (
            <li key={slice.key} className="flex items-center gap-2 text-body-sm">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length] }}
              />
              <span className="min-w-0 flex-1 truncate text-fg">
                {ALLOCATION_LABELS[slice.key] ?? slice.key}
              </span>
              <span className="shrink-0 tabular-nums text-fg-muted">
                {formatPercent(slice.percent, 1)}
              </span>
              <span className="shrink-0 whitespace-nowrap text-right font-semibold tabular-nums text-fg">
                <Money value={toNumber(slice.gross)} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  )
}
