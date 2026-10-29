import { useEffect, useMemo, useState } from 'react'
import { Receipt } from 'lucide-react'
import { Select } from '@/components/ui/select'
import { useCards } from '@/features/cards/hooks/use-cards'
import { useInvoices } from '@/features/invoices/hooks/use-invoices'
import { InvoiceHistoryList } from '@/features/invoices/components/invoice-history-list'
import { InvoiceFilterTabs } from '@/features/invoices/components/invoice-filter-tabs'
import { matchesInvoiceFilter, type InvoiceFilter } from '@/features/invoices/utils/invoice-status'

function InvoicesSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Carregando faturas">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-[120px] animate-pulse rounded-2xl bg-surface-2 lg:h-14" />
      ))}
    </div>
  )
}

export default function InvoicesPage() {
  const { data: cards, isLoading: cardsLoading } = useCards()
  const [cardId, setCardId] = useState<string | null>(null)
  const [filter, setFilter] = useState<InvoiceFilter>('all')

  const activeCards = useMemo(() => cards?.filter((c) => !c.archivedAt) ?? [], [cards])

  useEffect(() => {
    if (!cardId && activeCards.length > 0) {
      setCardId(activeCards[0].id)
    }
  }, [activeCards, cardId])

  const { data: invoices, isLoading, isError, refetch } = useInvoices(cardId ?? '')
  const cardName = activeCards.find((c) => c.id === cardId)?.name
  const filtered = (invoices?.content ?? []).filter((inv) => matchesInvoiceFilter(inv, filter))

  return (
    <div>
      <div className="page-h">
        <div>
          <h1 className="title">Faturas</h1>
          <div className="desc">Histórico de faturas por cartão, com correção de lançamentos.</div>
        </div>
        <div className="spacer" />
        <div className="actions w-full md:w-auto">
          <Select
            aria-label="Cartão"
            value={cardId ?? ''}
            onChange={(e) => setCardId(e.target.value)}
            disabled={cardsLoading || activeCards.length === 0}
          >
            {activeCards.length === 0 && <option value="">Nenhum cartão</option>}
            {activeCards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {cardId && (
        <InvoiceFilterTabs value={filter} onChange={setFilter} className="mb-4 md:max-w-sm" />
      )}

      {!cardId ? (
        cardsLoading ? (
          <p className="m-0 text-body-sm text-fg-muted">Carregando…</p>
        ) : (
          <div className="empty-state">
            <div className="icon">
              <Receipt size={22} aria-hidden="true" />
            </div>
            <h4>Nenhum cartão</h4>
            <p>Cadastre um cartão para ver o histórico de faturas.</p>
          </div>
        )
      ) : isLoading ? (
        <InvoicesSkeleton />
      ) : isError ? (
        <div role="alert" className="mb-6 flex flex-col items-start gap-2">
          <p className="m-0 text-body-sm text-expense">Erro ao carregar faturas.</p>
          <button className="btn btn-ghost btn-sm" onClick={() => void refetch()}>
            Tentar novamente
          </button>
        </div>
      ) : !invoices || invoices.content.length === 0 ? (
        <p className="m-0 text-body-sm text-fg-muted">
          Nenhuma fatura encontrada para este cartão.
        </p>
      ) : filtered.length === 0 ? (
        <p className="m-0 text-body-sm text-fg-muted">
          {filter === 'paid' ? 'Nenhuma fatura paga' : 'Nenhuma fatura em aberto'} neste cartão.
        </p>
      ) : (
        <InvoiceHistoryList invoices={filtered} cardName={cardName} />
      )}
    </div>
  )
}
