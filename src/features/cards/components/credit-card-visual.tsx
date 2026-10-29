import { CardFace } from '@/features/cards/components/card-face'
import { LimitUsageBar } from '@/features/cards/components/limit-usage-bar'
import { limitTone, type LimitView } from '@/features/cards/utils/limit-view'
import type { Card } from '@/features/cards/types'

interface CreditCardVisualProps {
  card: Card
  selected: boolean
  onSelect: () => void
  /** Uso do limite já resolvido (com o grupo somado). `null` enquanto carrega. */
  limitView: LimitView | null
}

const SUFFIX = { ok: '', warn: ' · perto do limite', over: ' · limite estourado' } as const

/**
 * Um cartão da lista: o cartão físico (selecionável) e, abaixo dele, a barra de limite.
 * O percentual aqui diz "usado" para não repetir o número grande do painel lateral.
 */
export function CreditCardVisual({ card, selected, onSelect, limitView }: CreditCardVisualProps) {
  return (
    <div
      className={`flex flex-col gap-3.5 rounded-2xl border bg-surface-1 p-2.5 pb-4 transition-colors ${
        selected ? 'border-brand shadow-brand' : 'border-border'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`${card.name} — cartão de crédito`}
        className="block w-full cursor-pointer rounded-[18px] border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1"
      >
        <CardFace card={card} />
      </button>

      <div className="px-1.5">
        {limitView ? (
          <LimitUsageBar
            view={limitView}
            label={limitView.shared ? 'Limite compartilhado' : 'Limite usado'}
            pctText={`${Math.round(limitView.pct)}% usado${SUFFIX[limitTone(limitView.pct)]}`}
          />
        ) : (
          <div className="flex flex-col gap-2" aria-hidden="true">
            <div className="h-3 w-1/2 animate-pulse rounded-xs bg-surface-3" />
            <div className="h-2.5 animate-pulse rounded-full bg-surface-3" />
          </div>
        )}
      </div>
    </div>
  )
}
