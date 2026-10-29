import type { ReactNode } from 'react'
import { Money } from '@/components/ui/money'
import { LimitUsageBar } from '@/features/cards/components/limit-usage-bar'
import { LIMIT_TONE_TEXT, limitTone, type LimitView } from '@/features/cards/utils/limit-view'
import type { Card, SpendingItem } from '@/features/cards/types'

const BRAND_LABELS: Record<string, string> = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  ELO: 'Elo',
  AMEX: 'American Express',
  HIPERCARD: 'Hipercard',
  OTHER: 'Outro',
}

/** Cores das barras de categoria, na ordem do maior para o menor gasto. */
const CATEGORY_TOKENS = [1, 7, 2, 6, 5, 3, 4, 9, 8, 10]

interface DetailRowProps {
  label: string
  value: ReactNode
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <dt className="text-body-sm text-fg-muted">{label}</dt>
      <dd className="m-0 text-body-sm font-medium tabular-nums">{value}</dd>
    </div>
  )
}

interface CardSidebarProps {
  card: Card
  limitView: LimitView | null
  spending: SpendingItem[] | undefined
  /** Esconde "Detalhes do cartão" — a tela de detalhe já mostra tudo no cartão. */
  showDetails?: boolean
}

export function CardSidebar({ card, limitView, spending, showDetails = true }: CardSidebarProps) {
  const creditLimit = parseFloat(card.creditLimit)
  const pct = limitView?.pct ?? 0
  const tone = limitTone(pct)

  const spendingItems = [...(spending ?? [])].sort(
    (a, b) => parseFloat(b.totalAmount) - parseFloat(a.totalAmount),
  )
  const maxSpending = spendingItems.length > 0 ? parseFloat(spendingItems[0].totalAmount) : 0

  return (
    <div className="flex flex-col gap-4">
      {/* Uso do limite */}
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-1 p-[18px]">
        <h3 className="m-0 text-body font-semibold">
          {limitView?.shared ? 'Uso do limite compartilhado' : 'Uso do limite'}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className={`font-display text-h1 font-bold tabular-nums ${LIMIT_TONE_TEXT[tone]}`}>
            {Math.round(pct)}%
          </span>
          <span className="text-caption text-fg-muted">
            de <Money value={limitView?.limit ?? creditLimit} />
          </span>
        </div>
        {limitView && <LimitUsageBar view={limitView} showSegments showHeader={false} />}
        {tone !== 'ok' && (
          <p className={`m-0 text-caption font-medium ${LIMIT_TONE_TEXT[tone]}`}>
            {tone === 'over' ? 'Limite estourado.' : 'Perto do limite.'}
          </p>
        )}
      </section>

      {/* Gastos por categoria */}
      {spendingItems.length > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-1 p-[18px]">
          <h3 className="m-0 text-body font-semibold">Por categoria</h3>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {spendingItems.map((item, i) => {
              const amount = parseFloat(item.totalAmount)
              const width = maxSpending > 0 ? (amount / maxSpending) * 100 : 0
              const token = CATEGORY_TOKENS[i % CATEGORY_TOKENS.length]
              return (
                <li key={item.categoryId ?? i} className="flex flex-col gap-1.5">
                  <div className="flex justify-between gap-2 text-body-sm">
                    <span className="truncate">{item.categoryName ?? 'Sem categoria'}</span>
                    <span className="tabular-nums text-fg-muted">
                      <Money value={amount} />
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${width}%`, background: `rgb(var(--cc-cat-${token}))` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Detalhes */}
      {showDetails && (
        <section className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-1 p-[18px]">
          <h3 className="m-0 text-body font-semibold">Detalhes do cartão</h3>
          <dl className="m-0 flex flex-col">
            <DetailRow label="Bandeira" value={BRAND_LABELS[card.brand] ?? card.brand} />
            {card.issuer && <DetailRow label="Emissor" value={card.issuer} />}
            <DetailRow label="Fechamento" value={`Dia ${card.closingDay}`} />
            <DetailRow label="Vencimento" value={`Dia ${card.dueDay}`} />
            <DetailRow label="Limite total" value={<Money value={creditLimit} />} />
          </dl>
        </section>
      )}
    </div>
  )
}
