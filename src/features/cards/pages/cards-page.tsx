import { useState } from 'react'
import { Plus, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCards } from '@/features/cards/hooks/use-cards'
import { useInvoice } from '@/features/cards/hooks/use-invoice'
import { useLimitUsage } from '@/features/cards/hooks/use-limit-usage'
import { useSpendingBreakdown } from '@/features/cards/hooks/use-spending-breakdown'
import { CreditCardVisual } from '@/features/cards/components/credit-card-visual'
import { AddCardVisual } from '@/features/cards/components/add-card-visual'
import { InvoiceCard } from '@/features/cards/components/invoice-card'
import { CardSidebar } from '@/features/cards/components/card-sidebar'
import { CreateCardDialog } from '@/features/cards/components/create-card-dialog'
import { RecordChargeDialog } from '@/features/cards/components/record-charge-dialog'
import { PayInvoiceDialog } from '@/features/cards/components/pay-invoice-dialog'

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

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
      className="row gap-4 mb-6"
      style={{ overflowX: 'auto', paddingBottom: 4 }}
      aria-busy="true"
      aria-label="Carregando cartões"
    >
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            flexShrink: 0,
            width: 280,
            height: 170,
            borderRadius: 14,
            background: 'var(--surface-2)',
          }}
        />
      ))}
    </div>
  )
}

export default function CardsPage() {
  const { data: cards, isLoading, isError, refetch } = useCards()
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [referenceMonth, setReferenceMonth] = useState(getCurrentMonth)
  const [createOpen, setCreateOpen] = useState(false)
  const [chargeOpen, setChargeOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)

  const activeCards = cards?.filter((c) => !c.archived) ?? []
  const selectedCard = activeCards.find((c) => c.id === selectedCardId) ?? activeCards[0] ?? null

  const spendingRange = getSpendingRange(referenceMonth)

  const { data: invoice, isLoading: invoiceLoading } = useInvoice(
    selectedCard?.id ?? '',
    referenceMonth,
  )
  const { data: limitUsage } = useLimitUsage(selectedCard?.id ?? '')
  const { data: spending } = useSpendingBreakdown(selectedCard?.id ?? '', spendingRange)

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
        <div className="actions">
          <Button
            leading={<Receipt size={14} />}
            onClick={() => setChargeOpen(true)}
            disabled={!selectedCard}
          >
            Novo lançamento
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
        <div role="alert" style={{ marginBottom: 24 }}>
          <p style={{ color: 'var(--expense)', fontSize: 13, marginBottom: 8 }}>
            Erro ao carregar cartões.
          </p>
          <Button size="sm" variant="ghost" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : activeCards.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: '64px 0',
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Nenhum cartão encontrado.</p>
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
          {/* Card visuals row */}
          <div
            className="row gap-4 mb-6"
            style={{ overflowX: 'auto', paddingBottom: 4 }}
            role="list"
            aria-label="Cartões de crédito"
          >
            {activeCards.map((card) => (
              <CreditCardVisual
                key={card.id}
                card={card}
                selected={card.id === selectedCard?.id}
                onSelect={() => setSelectedCardId(card.id)}
              />
            ))}
            <AddCardVisual onClick={() => setCreateOpen(true)} />
          </div>

          {/* Invoice + sidebar */}
          {selectedCard && (
            <div className="grid" style={{ gridTemplateColumns: '1fr 360px' }}>
              <InvoiceCard
                card={selectedCard}
                invoice={invoice}
                invoiceLoading={invoiceLoading}
                referenceMonth={referenceMonth}
                onMonthChange={setReferenceMonth}
                onPay={() => setPayOpen(true)}
              />
              <CardSidebar card={selectedCard} limitUsage={limitUsage} spending={spending} />
            </div>
          )}
        </>
      )}

      <CreateCardDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <RecordChargeDialog
        cardId={selectedCard?.id ?? ''}
        open={chargeOpen && !!selectedCard}
        onClose={() => setChargeOpen(false)}
      />

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
