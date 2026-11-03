import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Upload } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/ui/money'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { flattenCategories } from '@/features/categories/utils/flatten-categories'
import { categoryColorCss } from '@/features/categories/utils/category-colors'
import { glowOf } from '@/features/cards/components/card-face'
import { LIMIT_TONE_TEXT, limitTone, type LimitView } from '@/features/cards/utils/limit-view'
import {
  dueMonthLabel,
  dueMonthLabelWithYear,
  getCurrentInvoiceMonth,
  shiftMonth,
} from '@/features/cards/utils/invoice-month'
import type { Card, Invoice, SpendingItem } from '@/features/cards/types'
import { InvoiceStatusBadge } from '@/features/invoices/components/invoice-status-badge'
import { InvoiceItemRow } from '@/features/invoices/components/invoice-item-row'
import { canPayInvoice, dueBadge } from '@/features/invoices/utils/invoice-status'
import { ROUTES } from '@/app/router/routes'

const ICON_BTN =
  'btn btn-icon min-h-touch min-w-touch rounded-lg border border-border bg-surface-1 text-fg'
const SECTION = 'rounded-2xl border border-border bg-surface-1'
/** Quantos lançamentos e categorias cabem na tela; o resto fica no detalhe da fatura. */
const ITEMS_SHOWN = 5
const CATEGORIES_SHOWN = 3
const CATEGORY_TOKENS = [1, 7, 2, 6, 5, 3, 4, 9, 8, 10]
const BAR_TONE = {
  ok: 'rgb(var(--cc-brand))',
  warn: 'rgb(var(--cc-pending-solid))',
  over: 'rgb(var(--cc-overdue-solid))',
}

interface MobileCardsViewProps {
  cards: Card[]
  selectedCard: Card
  onSelectCard: (id: string) => void
  invoice: Invoice | undefined
  invoiceLoading: boolean
  referenceMonth: string
  onMonthChange: (month: string) => void
  onPay: () => void
  limitView: LimitView | null
  spending: SpendingItem[] | undefined
  onImport: () => void
  onCreate: () => void
}

/**
 * Cartões no celular: a fatura do cartão escolhido vem primeiro, os cartões viram pílulas e o
 * limite aparece uma vez só, dentro da fatura. Tablet e desktop seguem com o cartão físico.
 */
export function MobileCardsView({
  cards,
  selectedCard,
  onSelectCard,
  invoice,
  invoiceLoading,
  referenceMonth,
  onMonthChange,
  onPay,
  limitView,
  spending,
  onImport,
  onCreate,
}: MobileCardsViewProps) {
  const { data: categories } = useCategories()
  const flatCategories = useMemo(() => flattenCategories(categories ?? []), [categories])

  const currentMonth = getCurrentInvoiceMonth(selectedCard)
  const tabs = [-1, 0, 1].map((offset) => {
    const key = shiftMonth(currentMonth, offset)
    const label = dueMonthLabel(key, selectedCard)
    return { key, label: offset === 0 ? `${label} · atual` : label }
  })

  const total = invoice ? parseFloat(invoice.totalAmount) : 0
  const remaining = invoice ? total - parseFloat(invoice.paidAmount) : 0
  const due = invoice ? dueBadge(invoice) : null
  const tone = limitTone(limitView?.pct ?? 0)

  const topSpending = [...(spending ?? [])]
    .sort((a, b) => parseFloat(b.totalAmount) - parseFloat(a.totalAmount))
    .slice(0, CATEGORIES_SHOWN)
  const maxSpending = topSpending.length > 0 ? parseFloat(topSpending[0].totalAmount) : 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-touch items-center gap-2">
        <h1 className="m-0 flex-1 font-display text-h2 font-bold">Cartões</h1>
        <button type="button" className={ICON_BTN} aria-label="Importar fatura" onClick={onImport}>
          <Upload size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn btn-icon btn-primary min-h-touch min-w-touch rounded-lg"
          aria-label="Novo cartão"
          onClick={onCreate}
        >
          <Plus size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Seletor de cartão: rola de lado, sem barra. */}
      <div
        role="group"
        aria-label="Escolher cartão"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card) => {
          const selected = card.id === selectedCard.id
          return (
            <button
              key={card.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelectCard(card.id)}
              className={`flex min-h-touch shrink-0 items-center gap-2 rounded-lg border py-0 pl-2 pr-3 text-fg ${
                selected ? 'border-brand bg-brand-soft' : 'border-border bg-surface-1'
              }`}
            >
              <span
                aria-hidden="true"
                className="h-5 w-[30px] rounded-[4px]"
                style={{ background: `rgb(var(--cc-cat-${glowOf(card.id)}))` }}
              />
              <span className="text-body-sm font-semibold">{card.name}</span>
              {card.last4Digits && (
                <span className="font-mono text-[11px] text-fg-muted">•• {card.last4Digits}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Fatura primeiro */}
      <section aria-label="Fatura" className={`${SECTION} flex flex-col gap-3.5 p-4`}>
        <div className="tabs w-full" role="tablist" aria-label="Mês da fatura">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={referenceMonth === t.key}
              className={`flex-1 whitespace-nowrap px-2 ${referenceMonth === t.key ? 'on' : ''}`}
              onClick={() => onMonthChange(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {invoiceLoading ? (
          <div
            className="flex animate-pulse flex-col gap-2"
            aria-busy="true"
            aria-label="Carregando fatura"
          >
            <div className="h-3 w-1/3 rounded-full bg-surface-3" />
            <div className="h-9 w-1/2 rounded-sm bg-surface-3" />
            <div className="h-3 w-2/5 rounded-full bg-surface-3" />
          </div>
        ) : invoice ? (
          <>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-body-sm text-fg-muted">
                  Fatura de {dueMonthLabelWithYear(referenceMonth, selectedCard)}
                </span>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
              <span className="font-display text-amount-lg font-extrabold tabular-nums">
                <Money value={total} />
              </span>
              {due && invoice.status !== 'PAID' && (
                <span className="flex flex-wrap items-center gap-2">
                  <Badge kind={due.kind} dot={false}>
                    {due.label}
                  </Badge>
                  {remaining > 0 && remaining < total && (
                    <span className="text-caption text-fg-muted">
                      Falta <Money value={remaining} />
                    </span>
                  )}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              {canPayInvoice(invoice) && (
                <Button variant="primary" className="min-h-touch flex-1" onClick={onPay}>
                  Pagar fatura
                </Button>
              )}
              <Button
                variant="ghost"
                asChild
                className={`min-h-touch ${canPayInvoice(invoice) ? '' : 'flex-1'}`}
              >
                <Link to={ROUTES.INVOICE_DETAIL.replace(':invoiceId', invoice.id)}>Detalhes</Link>
              </Button>
            </div>
          </>
        ) : (
          <p className="m-0 text-body-sm text-fg-muted">Nenhuma fatura neste mês.</p>
        )}

        {/* Limite: uma vez só */}
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          {limitView ? (
            <>
              <div className="flex items-baseline justify-between gap-2 text-body-sm">
                <span className="text-fg-muted">
                  {limitView.shared ? 'Disponível no limite compartilhado' : 'Limite disponível'}
                </span>
                <span className="tabular-nums">
                  <b className={`text-body ${LIMIT_TONE_TEXT[tone]}`}>
                    <Money value={limitView.available} />
                  </b>{' '}
                  <span className="text-fg-muted">
                    de <Money value={limitView.limit} />
                  </span>
                </span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-surface-3"
                role="progressbar"
                aria-label="Limite usado"
                aria-valuenow={Math.round(limitView.pct)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(100, limitView.pct)}%`, background: BAR_TONE[tone] }}
                />
              </div>
            </>
          ) : (
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-surface-3" aria-hidden="true" />
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="text-caption text-fg-muted">
              Fecha dia {String(selectedCard.closingDay).padStart(2, '0')} · vence dia{' '}
              {String(selectedCard.dueDay).padStart(2, '0')}
            </span>
            {/* Editar e arquivar ficam no detalhe do cartão. */}
            <Link
              to={ROUTES.CARD_DETAIL.replace(':id', selectedCard.id)}
              className="flex min-h-touch items-center text-body-sm font-semibold text-brand"
            >
              Detalhes do cartão
            </Link>
          </div>
        </div>
      </section>

      {invoice && invoice.items.length > 0 && (
        <section aria-label="Lançamentos" className={`${SECTION} px-4 pb-1 pt-1`}>
          <div className="flex min-h-touch items-center justify-between">
            <h2 className="m-0 font-display text-body font-bold">Lançamentos</h2>
            {invoice.items.length > ITEMS_SHOWN && (
              <Link
                to={ROUTES.INVOICE_DETAIL.replace(':invoiceId', invoice.id)}
                className="flex min-h-touch items-center text-body-sm font-semibold text-brand"
              >
                Ver todos ({invoice.items.length})
              </Link>
            )}
          </div>
          {invoice.items.slice(0, ITEMS_SHOWN).map((item) => {
            const cat = flatCategories.find((c) => c.id === item.categoryId)
            return (
              <InvoiceItemRow
                key={item.id}
                item={item}
                categoryLabel={
                  item.subcategoryName ?? item.categoryName ?? cat?.name ?? 'Sem categoria'
                }
                categoryColor={cat?.color ? categoryColorCss(cat.color) : undefined}
              />
            )
          })}
        </section>
      )}

      {topSpending.length > 0 && (
        <section aria-label="Por categoria" className={`${SECTION} flex flex-col gap-3 p-4`}>
          <h2 className="m-0 font-display text-body font-bold">Por categoria</h2>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {topSpending.map((item, i) => {
              const amount = parseFloat(item.totalAmount)
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
                      style={{
                        width: `${maxSpending > 0 ? (amount / maxSpending) * 100 : 0}%`,
                        background: `rgb(var(--cc-cat-${CATEGORY_TOKENS[i % CATEGORY_TOKENS.length]}))`,
                      }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
