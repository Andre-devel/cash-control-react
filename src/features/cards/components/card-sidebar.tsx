import type { ReactNode } from 'react'
import { Money } from '@/components/ui/money'
import type { Card, LimitUsage, SpendingItem } from '@/features/cards/types'

const BRAND_LABELS: Record<string, string> = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  ELO: 'Elo',
  AMEX: 'American Express',
  HIPERCARD: 'Hipercard',
  OTHER: 'Outro',
}

interface DetailRowProps {
  label: string
  value: ReactNode
  mono?: boolean
}

function DetailRow({ label, value, mono }: DetailRowProps) {
  return (
    <div className="row between">
      <span className="text-xs text-dim">{label}</span>
      <span className={`text-sm fw-500${mono ? ' mono' : ''}`}>{value}</span>
    </div>
  )
}

interface CardSidebarProps {
  card: Card
  limitUsage: LimitUsage | undefined
  spending: SpendingItem[] | undefined
}

export function CardSidebar({ card, limitUsage, spending }: CardSidebarProps) {
  const creditLimit = parseFloat(card.creditLimit)
  const usedAmount = limitUsage ? parseFloat(limitUsage.usedAmount) : 0
  const availableAmount = limitUsage ? parseFloat(limitUsage.availableAmount) : creditLimit
  const usedPct = limitUsage?.usagePercentage
    ? parseFloat(limitUsage.usagePercentage)
    : creditLimit > 0
      ? Math.min(100, (usedAmount / creditLimit) * 100)
      : 0

  const spendingItems = spending ?? []
  const spendingTotal = spendingItems.reduce((sum, item) => sum + parseFloat(item.amount), 0)

  return (
    <div className="col gap-4">
      {/* Limit usage */}
      <div className="card">
        <div className="card-b">
          <div className="text-xs text-dim mb-2">Uso do limite</div>
          <div className="row gap-2" style={{ alignItems: 'baseline' }}>
            <div className="text-2xl mono fw-500">{usedPct.toFixed(0)}%</div>
            <div className="text-xs mono" style={{ color: 'var(--text-dim)' }}>
              de <Money value={creditLimit} />
            </div>
          </div>
          <div className="bar mt-3">
            <i style={{ width: `${usedPct}%`, background: card.color }} />
          </div>
          <div className="row between text-xs text-dim mt-2">
            <span>Disponível</span>
            <span className="mono fw-500" style={{ color: 'var(--text)' }}>
              <Money value={availableAmount} />
            </span>
          </div>
        </div>
      </div>

      {/* Spending by category */}
      {spendingItems.length > 0 && (
        <div className="card">
          <div className="card-h">
            <h3>Por categoria</h3>
          </div>
          <div className="card-b">
            {[...spendingItems]
              .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
              .map((item, i) => {
                const itemAmount = parseFloat(item.amount)
                const pct = spendingTotal > 0 ? (itemAmount / spendingTotal) * 100 : 0
                return (
                  <div key={item.categoryId ?? i} className="mb-4">
                    <div className="row between text-xs mb-2">
                      <span className="row gap-2" style={{ alignItems: 'center' }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            background: 'var(--accent)',
                            display: 'inline-block',
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontWeight: 500 }}>
                          {item.categoryName ?? 'Sem categoria'}
                        </span>
                      </span>
                      <span className="mono">
                        <Money value={itemAmount} />
                      </span>
                    </div>
                    <div className="bar">
                      <i style={{ width: `${pct}%`, background: 'var(--accent)' }} />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Card details */}
      <div className="card">
        <div className="card-h">
          <h3>Detalhes do cartão</h3>
        </div>
        <div className="card-b col gap-3">
          <DetailRow label="Bandeira" value={BRAND_LABELS[card.brand] ?? card.brand} />
          {card.issuer && <DetailRow label="Emissor" value={card.issuer} />}
          <DetailRow label="Final" value={`•••• ${card.lastFourDigits}`} mono />
          <DetailRow label="Fechamento" value={`Dia ${card.closingDay}`} />
          <DetailRow label="Vencimento" value={`Dia ${card.dueDay}`} />
          <DetailRow label="Limite total" value={<Money value={creditLimit} />} mono />
        </div>
      </div>
    </div>
  )
}
