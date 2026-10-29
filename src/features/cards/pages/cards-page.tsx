import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, CreditCard, Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/ui/money'
import { useCards } from '@/features/cards/hooks/use-cards'
import { useInvoice } from '@/features/cards/hooks/use-invoice'
import { useCardsLimitUsage } from '@/features/cards/hooks/use-cards-limit-usage'
import { useSpendingBreakdown } from '@/features/cards/hooks/use-spending-breakdown'
import { CreditCardVisual } from '@/features/cards/components/credit-card-visual'
import { AddCardVisual } from '@/features/cards/components/add-card-visual'
import { InvoiceCard } from '@/features/cards/components/invoice-card'
import { CardSidebar } from '@/features/cards/components/card-sidebar'
import { CreateCardDialog } from '@/features/cards/components/create-card-dialog'
import { PayInvoiceDialog } from '@/features/cards/components/pay-invoice-dialog'
import { ImportFaturaDialog } from '@/features/cards/components/import-fatura-dialog'
import { getCurrentInvoiceMonth } from '@/features/cards/utils/invoice-month'
import { limitViewFor } from '@/features/cards/utils/limit-view'
import { ROUTES } from '@/app/router/routes'

function getSpendingRange(referenceMonth: string) {
  const [y, m] = referenceMonth.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return {
    from: `${referenceMonth}-01`,
    to: `${referenceMonth}-${String(lastDay).padStart(2, '0')}`,
  }
}

function CardsSkeleton() {
  return (
    <div
      className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-label="Carregando cartões"
    >
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex flex-col gap-3.5 rounded-2xl border border-border bg-surface-1 p-2.5 pb-4"
        >
          <div className="aspect-[1.586] animate-pulse rounded-[18px] bg-surface-3" />
          <div className="mx-1.5 h-2.5 animate-pulse rounded-full bg-surface-3" />
        </div>
      ))}
    </div>
  )
}

export default function CardsPage() {
  const { data: cards, isLoading, isError, refetch } = useCards()
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [referenceMonth, setReferenceMonth] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const activeCards = useMemo(() => cards?.filter((c) => !c.archivedAt) ?? [], [cards])
  const archivedCards = cards?.filter((c) => c.archivedAt) ?? []
  const selectedCard = activeCards.find((c) => c.id === selectedCardId) ?? activeCards[0] ?? null

  useEffect(() => {
    if (selectedCard) {
      setReferenceMonth(getCurrentInvoiceMonth(selectedCard))
    }
  }, [selectedCard])

  const spendingRange = getSpendingRange(referenceMonth ?? '')

  const { data: invoice, isLoading: invoiceLoading } = useInvoice(
    selectedCard?.id ?? '',
    referenceMonth ?? '',
  )
  // Uso de todos os cartões ativos: cada cartão de um grupo compartilhado precisa do uso
  // dos outros para mostrar a barra somada.
  const usageByCard = useCardsLimitUsage(activeCards.map((c) => c.id))
  const { data: spending } = useSpendingBreakdown(selectedCard?.id ?? '', spendingRange)

  const selectedLimitView = selectedCard
    ? limitViewFor(selectedCard, activeCards, usageByCard)
    : null

  /** Totais da faixa de resumo. Um grupo compartilhado conta o limite uma vez só. */
  const totals = useMemo(() => {
    const seenGroups = new Set<string>()
    let limit = 0
    let available = 0
    let complete = activeCards.length > 0
    for (const card of activeCards) {
      if (card.sharedLimitGroupId) {
        if (seenGroups.has(card.sharedLimitGroupId)) continue
        seenGroups.add(card.sharedLimitGroupId)
      }
      const view = limitViewFor(card, activeCards, usageByCard)
      if (!view) {
        complete = false
        continue
      }
      limit += view.limit
      available += view.available
    }
    return complete ? { limit, available } : null
  }, [activeCards, usageByCard])

  return (
    <div>
      {/* Page header */}
      <div className="page-h">
        <div>
          <h1 className="title">Cartões de crédito</h1>
          <div className="desc">
            {isLoading
              ? 'Carregando…'
              : isError
                ? '—'
                : `${activeCards.length} ${activeCards.length === 1 ? 'cartão' : 'cartões'}`}
          </div>
        </div>
        <div className="spacer" />
        <div className="actions flex-wrap">
          {/* Não depende de selectedCard: um PDF de fatura pode cobrir vários cartões,
              e é a própria leitura que diz quais. */}
          <Button leading={<Upload size={14} />} onClick={() => setImportOpen(true)}>
            Importar fatura
          </Button>
          <Button
            variant="primary"
            leading={<Plus size={14} />}
            onClick={() => setCreateOpen(true)}
          >
            Novo cartão
          </Button>
        </div>
      </div>

      {isLoading ? (
        <CardsSkeleton />
      ) : isError ? (
        <div role="alert" className="mb-6 flex flex-col items-start gap-2">
          <p className="m-0 text-body-sm text-expense">Erro ao carregar cartões.</p>
          <Button size="sm" variant="ghost" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : activeCards.length === 0 ? (
        <div className="empty-state">
          <div className="icon">
            <CreditCard size={22} aria-hidden="true" />
          </div>
          <h4>Nenhum cartão encontrado.</h4>
          <p>Cadastre um cartão para acompanhar limite, faturas e parcelas.</p>
          <Button
            variant="primary"
            leading={<Plus size={14} />}
            onClick={() => setCreateOpen(true)}
          >
            Adicionar primeiro cartão
          </Button>
        </div>
      ) : (
        <>
          {/* Resumo */}
          {totals && (
            <div className="mb-4 grid grid-cols-2 gap-3 rounded-2xl border border-border bg-surface-1 px-4 py-3.5 md:max-w-md">
              <div className="flex flex-col gap-1.5">
                <span className="text-caption text-fg-muted">Limite total</span>
                <span className="text-[17px] font-bold leading-none tabular-nums">
                  <Money value={totals.limit} />
                </span>
              </div>
              <div className="flex flex-col gap-1.5 border-l border-border pl-3">
                <span className="text-caption text-fg-muted">Limite disponível</span>
                <span className="text-[17px] font-bold leading-none tabular-nums">
                  <Money value={totals.available} />
                </span>
              </div>
            </div>
          )}

          {/* Cartões */}
          <div
            className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
            role="list"
            aria-label="Cartões de crédito"
          >
            {activeCards.map((card) => (
              <div role="listitem" key={card.id}>
                <CreditCardVisual
                  card={card}
                  selected={card.id === selectedCard?.id}
                  onSelect={() => setSelectedCardId(card.id)}
                  limitView={limitViewFor(card, activeCards, usageByCard)}
                />
              </div>
            ))}
            <div role="listitem">
              <AddCardVisual onClick={() => setCreateOpen(true)} />
            </div>
          </div>

          {selectedCard && (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="m-0 font-display text-h2 font-bold">{selectedCard.name}</h2>
                <Button variant="ghost" size="sm" asChild className="min-h-touch">
                  <Link to={ROUTES.CARD_DETAIL.replace(':id', selectedCard.id)}>
                    Detalhes de {selectedCard.name}
                    <ChevronRight size={14} aria-hidden="true" />
                  </Link>
                </Button>
              </div>

              {/* Fatura + painel lateral: empilhados até 1280, lado a lado depois. */}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                <InvoiceCard
                  card={selectedCard}
                  invoice={invoice}
                  invoiceLoading={invoiceLoading}
                  referenceMonth={referenceMonth ?? ''}
                  onMonthChange={setReferenceMonth}
                  onPay={() => setPayOpen(true)}
                />
                <CardSidebar
                  card={selectedCard}
                  limitView={selectedLimitView}
                  spending={spending}
                />
              </div>
            </>
          )}
        </>
      )}

      {archivedCards.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-caption text-fg-muted">Arquivados:</span>
          {archivedCards.map((card) => (
            <Button key={card.id} variant="ghost" size="sm" asChild>
              <Link to={ROUTES.CARD_DETAIL.replace(':id', card.id)}>{card.name}</Link>
            </Button>
          ))}
        </div>
      )}

      <CreateCardDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <ImportFaturaDialog open={importOpen} onClose={() => setImportOpen(false)} />

      {invoice && selectedCard && (
        <PayInvoiceDialog
          invoice={invoice}
          cardName={selectedCard.name}
          open={payOpen}
          onClose={() => setPayOpen(false)}
        />
      )}
    </div>
  )
}
