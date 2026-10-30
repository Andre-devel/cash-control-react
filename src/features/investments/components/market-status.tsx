import { CircleAlert } from 'lucide-react'
import type { MarketIndexes } from '@/features/investments/types'
import { MARKET_INDEX_LABELS } from '@/features/investments/utils/labels'
import { formatLocalDate } from '@/lib/format-date'

/** Linha de status dos índices: data do CDI e aviso quando alguma fonte está atrasada. */
export function MarketStatus({ indexes }: { indexes: MarketIndexes | undefined }) {
  if (!indexes) return null
  const cdi = indexes.indexes.find((i) => i.index === 'CDI')
  const stale = [
    ...indexes.indexes.filter((i) => i.stale).map((i) => MARKET_INDEX_LABELS[i.index]),
    ...(indexes.treasuryStale ? ['Tesouro'] : []),
  ]

  return (
    <div className="flex flex-col gap-2">
      <p className="text-caption text-fg-muted">
        {cdi?.date ? `CDI de ${formatLocalDate(cdi.date)}` : 'CDI ainda não sincronizado'}
        {indexes.treasuryBaseDate &&
          ` · preços do Tesouro de ${formatLocalDate(indexes.treasuryBaseDate)}`}
      </p>
      {stale.length > 0 && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg bg-pending-soft px-3 py-2 text-body-sm font-semibold text-pending"
        >
          <CircleAlert size={16} aria-hidden="true" />
          {stale.join(', ')} {stale.length === 1 ? 'está desatualizado' : 'estão desatualizados'}:
          os valores podem não refletir os últimos dias.
        </p>
      )}
    </div>
  )
}
