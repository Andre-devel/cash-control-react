import { Link } from 'react-router-dom'
import { Plus, Upload } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/ui/money'
import { glowOf } from '@/features/cards/components/card-face'
import { LIMIT_TONE_TEXT, limitTone, type LimitView } from '@/features/cards/utils/limit-view'
import {
  dueMonthLabel,
  dueMonthLabelWithYear,
  getCurrentInvoiceMonth,
  shiftMonth,
} from '@/features/cards/utils/invoice-month'
import type { Card, Invoice } from '@/features/cards/types'
import { InvoiceStatusBadge } from '@/features/invoices/components/invoice-status-badge'
import { canPayInvoice, dueBadge } from '@/features/invoices/utils/invoice-status'
import { formatLocalDate } from '@/lib/format-date'
import { ROUTES } from '@/app/router/routes'

/**
 * Celular, tablet (768–1279) e desktop (≥ 1280). Em `/cards` fica só o resumo do cartão
 * escolhido: a fatura (valor, vencimento, pagar) e o limite, uma vez só. Lançamentos,
 * categorias e detalhes do cartão ficam em `/cards/:id`, para nada se repetir entre as duas.
 */
export type CardsLayout = 'mobile' | 'tablet' | 'desktop'

const ICON_BTN =
  'btn btn-icon min-h-touch min-w-touch rounded-lg border border-border bg-surface-1 text-fg'
const SECTION = 'rounded-2xl border border-border bg-surface-1'
const BAR_TONE = {
  ok: 'rgb(var(--cc-brand))',
  warn: 'rgb(var(--cc-pending-solid))',
  over: 'rgb(var(--cc-overdue-solid))',
}

function cardSwatch(card: Card) {
  return { background: `rgb(var(--cc-cat-${glowOf(card.id)}))` }
}

function pad(day: number) {
  return String(day).padStart(2, '0')
}

interface CardsOverviewProps {
  layout: CardsLayout
  cards: Card[]
  selectedCard: Card
  onSelectCard: (id: string) => void
  /** Uso do limite de cada cartão ativo, já com o grupo somado; `null` enquanto carrega. */
  limitViews: Record<string, LimitView | null>
  /** Disponível e limite somando todos os cartões (grupo conta uma vez); `null` enquanto carrega. */
  totals: { limit: number; available: number } | null
  invoice: Invoice | undefined
  invoiceLoading: boolean
  referenceMonth: string
  onMonthChange: (month: string) => void
  onPay: () => void
  onImport: () => void
  onCreate: () => void
}

export function CardsOverview(props: CardsOverviewProps) {
  const { layout, cards, selectedCard, limitViews, totals } = props
  const limitView = limitViews[selectedCard.id] ?? null

  const header =
    layout === 'mobile' ? (
      <div className="flex min-h-touch items-center gap-2">
        <h1 className="m-0 flex-1 font-display text-h2 font-bold">Cartões</h1>
        <button
          type="button"
          className={ICON_BTN}
          aria-label="Importar fatura"
          onClick={props.onImport}
        >
          <Upload size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn btn-icon btn-primary min-h-touch min-w-touch rounded-lg"
          aria-label="Novo cartão"
          onClick={props.onCreate}
        >
          <Plus size={18} aria-hidden="true" />
        </button>
      </div>
    ) : (
      <div className="page-h">
        <div>
          <h1 className="title">Cartões de crédito</h1>
          <div className="desc">
            {cards.length} {cards.length === 1 ? 'cartão' : 'cartões'}
            {totals && (
              <>
                {' · '}
                <Money value={totals.available} /> disponíveis de <Money value={totals.limit} />
              </>
            )}
          </div>
        </div>
        <div className="spacer" />
        <div className="actions flex-wrap">
          <Button leading={<Upload size={14} />} onClick={props.onImport}>
            Importar fatura
          </Button>
          <Button variant="primary" leading={<Plus size={14} />} onClick={props.onCreate}>
            Novo cartão
          </Button>
        </div>
      </div>
    )

  if (layout === 'desktop') {
    return (
      <div className="flex flex-col gap-5">
        {header}
        <div className="grid grid-cols-[260px_minmax(0,1fr)] items-start gap-5 2xl:grid-cols-[300px_minmax(0,1fr)]">
          <CardList
            cards={cards}
            selectedCard={selectedCard}
            onSelectCard={props.onSelectCard}
            limitViews={limitViews}
            onCreate={props.onCreate}
          />
          <InvoiceSection {...props} limitView={limitView} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {header}
      <CardPills
        cards={cards}
        selectedCard={selectedCard}
        onSelectCard={props.onSelectCard}
        onCreate={layout === 'tablet' ? props.onCreate : undefined}
      />
      <InvoiceSection {...props} limitView={limitView} />
    </div>
  )
}

interface CardPillsProps {
  cards: Card[]
  selectedCard: Card
  onSelectCard: (id: string) => void
  /** Só no tablet: no celular o "Novo cartão" já está no cabeçalho. */
  onCreate?: () => void
}

/** Pílulas no lugar do cartão físico. No celular rolam de lado, sem barra; no tablet quebram. */
function CardPills({ cards, selectedCard, onSelectCard, onCreate }: CardPillsProps) {
  return (
    <div
      role="group"
      aria-label="Escolher cartão"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden"
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
              style={cardSwatch(card)}
            />
            <span className="text-body-sm font-semibold">{card.name}</span>
            {card.last4Digits && (
              <span className="font-mono text-[11px] text-fg-muted">•• {card.last4Digits}</span>
            )}
          </button>
        )
      })}
      {onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="flex min-h-touch shrink-0 items-center gap-1.5 rounded-lg border border-dashed border-border-strong px-3 text-body-sm font-semibold text-brand"
        >
          <Plus size={14} aria-hidden="true" />
          Adicionar cartão
        </button>
      )}
    </div>
  )
}

interface CardListProps {
  cards: Card[]
  selectedCard: Card
  onSelectCard: (id: string) => void
  limitViews: Record<string, LimitView | null>
  onCreate: () => void
}

/** Desktop: lista compacta, com a fatura atual e o uso do limite de cada cartão. */
function CardList({ cards, selectedCard, onSelectCard, limitViews, onCreate }: CardListProps) {
  return (
    <section aria-label="Seus cartões" className={`${SECTION} flex flex-col gap-1 p-2`}>
      <h2 className="m-0 px-2 pb-1 pt-2 text-caption font-semibold uppercase tracking-wide text-fg-muted">
        Seus cartões
      </h2>
      <div role="group" aria-label="Escolher cartão" className="flex flex-col gap-1">
        {cards.map((card) => {
          const selected = card.id === selectedCard.id
          const view = limitViews[card.id]
          const tone = limitTone(view?.pct ?? 0)
          return (
            <button
              key={card.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelectCard(card.id)}
              className={`flex flex-col gap-2 rounded-xl border p-3 text-left text-fg ${
                selected ? 'border-brand bg-brand-soft' : 'border-transparent hover:bg-surface-2'
              }`}
            >
              <span className="flex w-full items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="h-[26px] w-10 shrink-0 rounded-[5px]"
                  style={cardSwatch(card)}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-body-sm font-semibold">{card.name}</span>
                  {card.last4Digits && (
                    <span className="font-mono text-[11px] text-fg-muted">
                      •• {card.last4Digits}
                    </span>
                  )}
                </span>
                {card.currentInvoiceTotal && (
                  <span className="text-body-sm font-bold tabular-nums">
                    <Money value={parseFloat(card.currentInvoiceTotal)} />
                  </span>
                )}
              </span>
              {view && (
                <span
                  className="block h-1 w-full overflow-hidden rounded-full bg-surface-3"
                  role="img"
                  aria-label={`${Math.round(view.pct)}% do limite usado`}
                >
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${Math.min(100, view.pct)}%`, background: BAR_TONE[tone] }}
                  />
                </span>
              )}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-strong text-body-sm font-semibold text-brand"
      >
        <Plus size={14} aria-hidden="true" />
        Adicionar cartão
      </button>
    </section>
  )
}

type InvoiceSectionProps = CardsOverviewProps & { limitView: LimitView | null }

function InvoiceSection({
  layout,
  selectedCard,
  invoice,
  invoiceLoading,
  referenceMonth,
  onMonthChange,
  onPay,
  limitView,
}: InvoiceSectionProps) {
  const currentMonth = getCurrentInvoiceMonth(selectedCard)
  const offsets = layout === 'mobile' ? [-1, 0, 1] : [-2, -1, 0, 1]
  const tabs = offsets.map((offset) => {
    const key = shiftMonth(currentMonth, offset)
    const label = dueMonthLabel(key, selectedCard)
    return { key, label: offset === 0 ? `${label} · atual` : label }
  })

  const closesAt = invoice?.closingDate ?? `${referenceMonth}-${pad(selectedCard.closingDay)}`
  const total = invoice ? parseFloat(invoice.totalAmount) : 0
  const remaining = invoice ? total - parseFloat(invoice.paidAmount) : 0
  const due = invoice ? dueBadge(invoice) : null
  const payable = invoice ? canPayInvoice(invoice) : false
  const invoiceHref = invoice ? ROUTES.INVOICE_DETAIL.replace(':invoiceId', invoice.id) : ''
  const cardHref = ROUTES.CARD_DETAIL.replace(':id', selectedCard.id)

  const monthTabs = (
    <div
      className={`tabs ${layout === 'mobile' ? 'w-full' : 'w-max'}`}
      role="tablist"
      aria-label="Mês da fatura"
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={referenceMonth === t.key}
          className={`whitespace-nowrap px-2 ${layout === 'mobile' ? 'flex-1' : ''} ${referenceMonth === t.key ? 'on' : ''}`}
          onClick={() => onMonthChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )

  const amount = invoice && (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2 md:justify-start">
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
      {/* As datas de verdade: a aba nomeia a fatura pelo mês do vencimento, e só com elas
          "Jun" ao lado de um fechamento em 01/05 se explica. */}
      <span className="text-caption text-fg-muted">
        Fecha em {formatLocalDate(closesAt)} · vence em {formatLocalDate(invoice.dueDate)}
      </span>
    </div>
  )

  const cardLink = (
    <Link
      to={cardHref}
      className="flex min-h-touch items-center whitespace-nowrap text-body-sm font-semibold text-brand"
    >
      Detalhes do cartão
    </Link>
  )

  const limit = (
    <div className="flex min-w-0 flex-col gap-2">
      {limitView ? (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-body-sm">
            <span className="text-fg-muted">
              {limitView.shared ? 'Disponível no limite compartilhado' : 'Limite disponível'}
            </span>
            <span className="tabular-nums">
              <b className={`text-body ${LIMIT_TONE_TEXT[limitTone(limitView.pct)]}`}>
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
              style={{
                width: `${Math.min(100, limitView.pct)}%`,
                background: BAR_TONE[limitTone(limitView.pct)],
              }}
            />
          </div>
        </>
      ) : (
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-surface-3" aria-hidden="true" />
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="text-caption text-fg-muted">
          Fecha dia {pad(selectedCard.closingDay)} · vence dia {pad(selectedCard.dueDay)}
        </span>
        {layout !== 'tablet' && cardLink}
      </div>
    </div>
  )

  const payButton = payable && (
    <Button
      variant="primary"
      className={`min-h-touch ${layout === 'mobile' ? 'flex-1' : ''}`}
      onClick={onPay}
    >
      Pagar fatura
    </Button>
  )
  const invoiceLink = invoice && (
    <Button
      variant="ghost"
      asChild
      className={`min-h-touch ${layout === 'mobile' && !payable ? 'flex-1' : ''}`}
    >
      <Link to={invoiceHref}>{layout === 'mobile' ? 'Ver fatura' : 'Ver fatura completa'}</Link>
    </Button>
  )

  let summary
  if (invoiceLoading) {
    summary = (
      <div
        className="flex animate-pulse flex-col gap-2"
        aria-busy="true"
        aria-label="Carregando fatura"
      >
        <div className="h-3 w-1/3 rounded-full bg-surface-3" />
        <div className="h-9 w-1/2 rounded-sm bg-surface-3" />
        <div className="h-3 w-2/5 rounded-full bg-surface-3" />
      </div>
    )
  } else if (!invoice) {
    summary = (
      <>
        <p className="m-0 text-body-sm text-fg-muted">Nenhuma fatura neste mês.</p>
        <div className="border-t border-border pt-3">{limit}</div>
      </>
    )
  } else if (layout === 'mobile') {
    summary = (
      <>
        {amount}
        <div className="flex gap-2">
          {payButton}
          {invoiceLink}
        </div>
        <div className="border-t border-border pt-3">{limit}</div>
      </>
    )
  } else if (layout === 'tablet') {
    summary = (
      <>
        <div className="grid grid-cols-2 gap-6">
          {amount}
          <div className="flex flex-col justify-center border-l border-border pl-6">{limit}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {payButton}
          {invoiceLink}
          <span className="flex-1" />
          {cardLink}
        </div>
      </>
    )
  } else {
    summary = (
      // Três colunas só com folga (≥ 1536); antes, valor e limite lado a lado e as ações embaixo.
      <div className="grid grid-cols-2 items-center gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto]">
        {amount}
        <div className="border-l border-border pl-6">{limit}</div>
        <div className="col-span-2 flex flex-wrap items-center gap-2 2xl:col-span-1 2xl:flex-col 2xl:items-stretch 2xl:gap-1">
          {payButton}
          {invoiceLink}
        </div>
      </div>
    )
  }

  return (
    <section
      aria-label="Fatura"
      className={`${SECTION} flex min-w-0 flex-col ${layout === 'mobile' ? 'gap-3.5 p-4' : ''}`}
    >
      {layout === 'mobile' ? (
        <>
          {monthTabs}
          {summary}
        </>
      ) : (
        <>
          <header className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
            <h2 className="m-0 flex-1 font-display text-h2 font-bold">
              Fatura · {selectedCard.name}
            </h2>
            {monthTabs}
          </header>
          <div className="flex flex-col gap-4 p-5">{summary}</div>
        </>
      )}
    </section>
  )
}
