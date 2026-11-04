import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCards } from '@/features/cards/hooks/use-cards'
import { useInvoice } from '@/features/cards/hooks/use-invoice'
import { useCardsLimitUsage } from '@/features/cards/hooks/use-cards-limit-usage'
import { useSpendingBreakdown } from '@/features/cards/hooks/use-spending-breakdown'
import { CreateCardDialog } from '@/features/cards/components/create-card-dialog'
import { PayInvoiceDialog } from '@/features/cards/components/pay-invoice-dialog'
import { ImportFaturaDialog } from '@/features/cards/components/import-fatura-dialog'
import { getCurrentInvoiceMonth } from '@/features/cards/utils/invoice-month'
import { limitViewFor } from '@/features/cards/utils/limit-view'
import { CardsOverview, type CardsLayout } from '@/features/cards/components/cards-overview'
import { useMediaQuery, MOBILE_QUERY, DESKTOP_QUERY } from '@/hooks/use-media-query'
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
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
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

  const limitViews = useMemo(
    () =>
      Object.fromEntries(
        activeCards.map((card) => [card.id, limitViewFor(card, activeCards, usageByCard)]),
      ),
    [activeCards, usageByCard],
  )

  /** Disponível e limite de todos os cartões. Um grupo compartilhado conta o limite uma vez só. */
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
      const view = limitViews[card.id]
      if (!view) {
        complete = false
        continue
      }
      limit += view.limit
      available += view.available
    }
    return complete ? { limit, available } : null
  }, [activeCards, limitViews])

  const layout: CardsLayout = isMobile ? 'mobile' : isDesktop ? 'desktop' : 'tablet'

  return (
    <div>
      {selectedCard && !isError ? (
        <CardsOverview
          layout={layout}
          cards={activeCards}
          selectedCard={selectedCard}
          onSelectCard={setSelectedCardId}
          limitViews={limitViews}
          totals={totals}
          invoice={invoice}
          invoiceLoading={invoiceLoading}
          referenceMonth={referenceMonth ?? ''}
          onMonthChange={setReferenceMonth}
          onPay={() => setPayOpen(true)}
          spending={spending}
          onImport={() => setImportOpen(true)}
          onCreate={() => setCreateOpen(true)}
        />
      ) : (
        <>
          <div className="page-h">
            <div>
              <h1 className="title">Cartões de crédito</h1>
              <div className="desc">{isLoading ? 'Carregando…' : isError ? '—' : '0 cartões'}</div>
            </div>
            <div className="spacer" />
            <div className="actions flex-wrap">
              {/* Não depende de um cartão: um PDF de fatura pode cobrir vários cartões,
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
          ) : (
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
