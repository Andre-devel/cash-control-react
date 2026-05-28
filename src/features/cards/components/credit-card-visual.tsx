import { useLimitUsage } from '@/features/cards/hooks/use-limit-usage'
import { Money } from '@/components/ui/money'
import type { Card } from '@/features/cards/types'

interface CreditCardVisualProps {
  card: Card
  selected: boolean
  onSelect: () => void
}

export function CreditCardVisual({ card, selected, onSelect }: CreditCardVisualProps) {
  const { data: limitUsage } = useLimitUsage(card.id)
  const usedAmount = limitUsage ? parseFloat(limitUsage.usedAmount) : null
  const creditLimit = parseFloat(card.creditLimit)
  const usedPct = usedAmount !== null && creditLimit > 0 ? (usedAmount / creditLimit) * 100 : 0

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${card.name} — cartão de crédito`}
      style={{
        flexShrink: 0,
        width: 280,
        height: 170,
        borderRadius: 14,
        padding: 18,
        border: `1px solid ${selected ? card.color : 'var(--border)'}`,
        background: `
          radial-gradient(140% 80% at 0% 0%, ${card.color}55, transparent 55%),
          linear-gradient(135deg, ${card.color}22, transparent 70%),
          var(--surface-2)
        `,
        position: 'relative',
        textAlign: 'left',
        cursor: 'pointer',
        boxShadow: selected ? `0 0 0 2px ${card.color}, 0 12px 32px -8px ${card.color}44` : 'none',
        color: 'var(--text)',
        transition: 'box-shadow 120ms, border-color 120ms',
      }}
    >
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="text-xs text-dim">{card.brand}</div>
          <div className="fw-600" style={{ fontSize: 14, marginTop: 2 }}>
            {card.name}
          </div>
        </div>
        <div
          aria-hidden="true"
          style={{
            width: 32,
            height: 22,
            background: 'linear-gradient(135deg, #d4af6a, #8b6a35)',
            borderRadius: 4,
            opacity: 0.7,
          }}
        />
      </div>

      <div
        className="mono"
        style={{ marginTop: 24, fontSize: 18, letterSpacing: '0.08em', color: 'var(--text)' }}
      >
        ••••&nbsp;&nbsp;••••&nbsp;&nbsp;••••&nbsp;&nbsp;{card.lastFourDigits}
      </div>

      <div className="row between" style={{ marginTop: 16 }}>
        <div>
          <div
            className="text-xs text-faint"
            style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}
          >
            Fatura aberta
          </div>
          <div className="mono text-sm fw-500">
            {usedAmount !== null ? <Money value={usedAmount} /> : '—'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            className="text-xs text-faint"
            style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}
          >
            Limite
          </div>
          <div className="mono text-sm fw-500" style={{ color: 'var(--text-muted)' }}>
            {usedPct.toFixed(0)}% usado
          </div>
        </div>
      </div>
    </button>
  )
}
