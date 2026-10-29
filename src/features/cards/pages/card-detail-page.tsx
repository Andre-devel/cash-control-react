import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Archive,
  ArchiveRestore,
  Check,
  ChevronLeft,
  ChevronRight,
  FileUp,
  Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Money } from '@/components/ui/money'
import { useCard } from '@/features/cards/hooks/use-card'
import { useCards } from '@/features/cards/hooks/use-cards'
import { useInvoice } from '@/features/cards/hooks/use-invoice'
import { useCardsLimitUsage } from '@/features/cards/hooks/use-cards-limit-usage'
import { useSpendingBreakdown } from '@/features/cards/hooks/use-spending-breakdown'
import { CardFace } from '@/features/cards/components/card-face'
import { CardSidebar } from '@/features/cards/components/card-sidebar'
import { EditCardDialog } from '@/features/cards/components/edit-card-dialog'
import { PayInvoiceDialog } from '@/features/cards/components/pay-invoice-dialog'
import { ArchiveCardDialog } from '@/features/cards/components/archive-card-dialog'
import { ImportFaturaDialog } from '@/features/cards/components/import-fatura-dialog'
import { useUnarchiveCard } from '@/features/cards/hooks/use-unarchive-card'
import {
  dueMonthLabelWithYear,
  getCurrentInvoiceMonth,
  shiftMonth,
} from '@/features/cards/utils/invoice-month'
import { limitViewFor } from '@/features/cards/utils/limit-view'
import { useInvoices } from '@/features/invoices/hooks/use-invoices'
import { InvoiceStatusBadge } from '@/features/invoices/components/invoice-status-badge'
import { InvoiceItemRow } from '@/features/invoices/components/invoice-item-row'
import { InvoiceHistoryList } from '@/features/invoices/components/invoice-history-list'
import { InvoiceFilterTabs } from '@/features/invoices/components/invoice-filter-tabs'
import { matchesInvoiceFilter, type InvoiceFilter } from '@/features/invoices/utils/invoice-status'
import { ROUTES } from '@/app/router/routes'
import { formatLocalDate } from '@/lib/format-date'

function CardDetailSkeleton() {
  return (
    <div
      className="grid animate-pulse grid-cols-1 gap-5 xl:grid-cols-[380px_minmax(0,1fr)]"
      aria-busy="true"
      aria-label="Carregando cartão"
    >
      <div className="aspect-[1.586] rounded-[22px] bg-surface-3" />
      <div className="h-64 rounded-2xl bg-surface-3" />
    </div>
  )
}

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [referenceMonth, setReferenceMonth] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<InvoiceFilter>('all')
  const { mutate: unarchiveCard, isPending: unarchivePending } = useUnarchiveCard()

  const spendingFrom = referenceMonth ? `${referenceMonth}-01` : ''
  const spendingTo = referenceMonth
    ? (() => {
        const [y, m] = referenceMonth.split('-').map(Number)
        const lastDay = new Date(y, m, 0).getDate()
        return `${referenceMonth}-${String(lastDay).padStart(2, '0')}`
      })()
    : ''

  const {
    data: card,
    isLoading: cardLoading,
    isError: cardError,
    refetch: refetchCard,
  } = useCard(id ?? '')

  useEffect(() => {
    if (card && referenceMonth === null) {
      setReferenceMonth(getCurrentInvoiceMonth(card))
    }
  }, [card, referenceMonth])

  const { data: invoice, isLoading: invoiceLoading } = useInvoice(id ?? '', referenceMonth ?? '')
  const { data: spending } = useSpendingBreakdown(id ?? '', { from: spendingFrom, to: spendingTo })
  const { data: invoices, isLoading: invoicesLoading } = useInvoices(id ?? '')

  // Num grupo de limite compartilhado, a barra soma o uso dos outros cartões do grupo.
  const { data: allCards } = useCards()
  const groupCards = useMemo(() => {
    if (!card) return []
    if (!card.sharedLimitGroupId) return [card]
    const members = (allCards ?? []).filter(
      (c) => c.sharedLimitGroupId === card.sharedLimitGroupId && !c.archivedAt,
    )
    return members.some((c) => c.id === card.id) ? members : [card, ...members]
  }, [card, allCards])
  const usageByCard = useCardsLimitUsage(groupCards.map((c) => c.id))
  const limitView = card ? limitViewFor(card, groupCards, usageByCard) : null

  const filteredInvoices = (invoices?.content ?? []).filter((inv) =>
    matchesInvoiceFilter(inv, historyFilter),
  )

  const totalAmount = invoice ? parseFloat(invoice.totalAmount) : 0
  const paidAmount = invoice ? parseFloat(invoice.paidAmount) : 0
  const remainingAmount = totalAmount - paidAmount

  return (
    <div className="flex flex-col gap-5">
      {/* Cabeçalho: trilha + nome + ações */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="min-w-0 flex-1">
          <nav
            aria-label="Trilha"
            className="mb-1 flex items-center gap-1 text-body-sm text-fg-muted"
          >
            <Link
              to={ROUTES.CARDS}
              className="inline-flex min-h-touch items-center gap-1 text-fg-muted no-underline hover:text-fg"
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Cartões
            </Link>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="m-0 font-display text-h1 font-extrabold">{card?.name ?? 'Cartão'}</h1>
            {card?.archivedAt && (
              <Badge kind="pending" icon={<Archive aria-hidden="true" />}>
                Arquivado
              </Badge>
            )}
          </div>
        </div>
        {card && (
          <div className="flex flex-wrap gap-2">
            <Button
              className="min-h-touch"
              leading={<Pencil size={14} />}
              onClick={() => setEditOpen(true)}
            >
              Editar
            </Button>
            {card.archivedAt ? (
              <Button
                className="min-h-touch"
                leading={<ArchiveRestore size={14} />}
                loading={unarchivePending}
                onClick={() => unarchiveCard(card.id)}
              >
                Desarquivar
              </Button>
            ) : (
              <Button
                className="min-h-touch"
                leading={<Archive size={14} />}
                onClick={() => setArchiveOpen(true)}
              >
                Arquivar
              </Button>
            )}
            <Button
              variant="primary"
              className="min-h-touch"
              leading={<FileUp size={14} />}
              onClick={() => setImportOpen(true)}
            >
              Importar fatura (PDF)
            </Button>
          </div>
        )}
      </div>

      {cardLoading ? (
        <CardDetailSkeleton />
      ) : cardError ? (
        <div className="flex flex-col items-start gap-2" role="alert">
          <p className="m-0 text-body-sm text-expense">Falha ao carregar cartão.</p>
          <Button variant="ghost" size="sm" onClick={() => void refetchCard()}>
            Tentar novamente
          </Button>
        </div>
      ) : card ? (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-[380px_minmax(0,1fr)]">
            {/* Coluna do cartão */}
            <div className="flex flex-col gap-3.5">
              <div className="mx-auto w-full max-w-[420px] md:max-w-none">
                <CardFace card={card} large />
              </div>
              <CardSidebar
                card={card}
                limitView={limitView}
                spending={spending}
                showDetails={false}
              />
            </div>

            {/* Coluna das faturas */}
            <div className="flex min-w-0 flex-col gap-5">
              <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-1 p-4 md:p-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="m-0 font-display text-h2 font-bold">Fatura</h2>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="min-h-touch min-w-touch"
                      aria-label="Mês anterior"
                      onClick={() =>
                        referenceMonth && setReferenceMonth(shiftMonth(referenceMonth, -1))
                      }
                    >
                      <ChevronLeft size={16} aria-hidden="true" />
                    </Button>
                    <span className="min-w-[88px] text-center text-body-sm font-semibold">
                      {referenceMonth ? dueMonthLabelWithYear(referenceMonth, card) : '—'}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="min-h-touch min-w-touch"
                      aria-label="Próximo mês"
                      onClick={() =>
                        referenceMonth && setReferenceMonth(shiftMonth(referenceMonth, 1))
                      }
                    >
                      <ChevronRight size={16} aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                {invoiceLoading ? (
                  <div
                    className="flex animate-pulse flex-col gap-2"
                    aria-busy="true"
                    aria-label="Carregando fatura"
                  >
                    <div className="h-9 w-40 rounded-sm bg-surface-3" />
                    <div className="h-4 w-24 rounded-sm bg-surface-3" />
                  </div>
                ) : invoice ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <InvoiceStatusBadge status={invoice.status} />
                      <span className="text-caption text-fg-muted">
                        Vence em {formatLocalDate(invoice.dueDate)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-body-sm text-fg-muted">Total</span>
                      <span className="font-display text-amount-lg font-extrabold tabular-nums">
                        <Money value={totalAmount} />
                      </span>
                    </div>
                    <dl className="m-0 grid grid-cols-2 gap-3 border-t border-border pt-3 tabular-nums">
                      <div className="flex flex-col gap-1">
                        <dt className="text-caption text-fg-muted">Pago</dt>
                        <dd className="m-0 text-body-sm font-semibold">
                          <Money value={paidAmount} />
                        </dd>
                      </div>
                      <div className="flex flex-col gap-1">
                        <dt className="text-caption text-fg-muted">Restante</dt>
                        <dd
                          className={`m-0 text-body-sm font-semibold ${remainingAmount > 0 ? 'text-pending' : 'text-paid'}`}
                        >
                          <Money value={remainingAmount} />
                        </dd>
                      </div>
                    </dl>

                    <div className="flex flex-wrap gap-2">
                      {remainingAmount > 0 && (
                        <Button
                          variant="primary"
                          className="min-h-touch"
                          leading={<Check size={14} />}
                          onClick={() => setPayOpen(true)}
                        >
                          Pagar fatura
                        </Button>
                      )}
                      <Button variant="ghost" asChild className="min-h-touch">
                        <Link to={ROUTES.INVOICE_DETAIL.replace(':invoiceId', invoice.id)}>
                          Ver fatura
                          <ChevronRight size={14} aria-hidden="true" />
                        </Link>
                      </Button>
                    </div>

                    {invoice.items.length > 0 ? (
                      <div>
                        <h3 className="m-0 mb-1 text-body font-semibold">Cobranças</h3>
                        {invoice.items.map((item) => (
                          <InvoiceItemRow
                            key={item.id}
                            item={item}
                            categoryLabel={
                              item.subcategoryName ?? item.categoryName ?? 'Sem categoria'
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="m-0 text-body-sm text-fg-muted">
                        Nenhuma cobrança neste período.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="m-0 text-body-sm text-fg-muted">
                    Nenhuma fatura encontrada para este mês.
                  </p>
                )}
              </section>

              {/* Histórico */}
              <section className="flex flex-col gap-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="m-0 font-display text-h2 font-bold">Faturas</h2>
                  <InvoiceFilterTabs value={historyFilter} onChange={setHistoryFilter} />
                </div>
                {invoicesLoading ? (
                  <div
                    className="h-32 animate-pulse rounded-2xl bg-surface-2"
                    aria-busy="true"
                    aria-label="Carregando faturas"
                  />
                ) : filteredInvoices.length === 0 ? (
                  <p className="m-0 text-body-sm text-fg-muted">
                    Nenhuma fatura{' '}
                    {historyFilter === 'paid'
                      ? 'paga'
                      : historyFilter === 'open'
                        ? 'em aberto'
                        : 'encontrada'}{' '}
                    para este cartão.
                  </p>
                ) : (
                  <InvoiceHistoryList invoices={filteredInvoices} />
                )}
              </section>
            </div>
          </div>

          <EditCardDialog card={card} open={editOpen} onClose={() => setEditOpen(false)} />
          <ArchiveCardDialog card={card} open={archiveOpen} onClose={() => setArchiveOpen(false)} />
          <ImportFaturaDialog open={importOpen} onClose={() => setImportOpen(false)} />
          {invoice && (
            <PayInvoiceDialog
              invoice={invoice}
              cardName={card.name}
              open={payOpen}
              onClose={() => setPayOpen(false)}
            />
          )}
        </>
      ) : null}
    </div>
  )
}
