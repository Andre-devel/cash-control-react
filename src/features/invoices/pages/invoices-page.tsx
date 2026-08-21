import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Money } from '@/components/ui/money'
import { Select } from '@/components/ui/select'
import { useCards } from '@/features/cards/hooks/use-cards'
import { dueMonthLabelWithYear } from '@/features/cards/utils/invoice-month'
import { useInvoices } from '@/features/invoices/hooks/use-invoices'
import {
  INVOICE_STATUS_LABELS,
  invoiceStatusBadgeKind,
} from '@/features/invoices/utils/invoice-status'
import { useMediaQuery, MOBILE_QUERY } from '@/hooks/use-media-query'
import { ROUTES } from '@/app/router/routes'
import type { InvoiceSummary } from '@/features/invoices/types'

function InvoicesSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Carregando faturas">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{ height: 56, borderRadius: 8, background: 'var(--surface-2)' }}
        />
      ))}
    </div>
  )
}

function invoiceHref(invoice: InvoiceSummary) {
  return ROUTES.INVOICE_DETAIL.replace(':invoiceId', invoice.id)
}

function InvoiceCard({ invoice }: { invoice: InvoiceSummary }) {
  return (
    <Link
      to={invoiceHref(invoice)}
      className="list-row"
      style={{ padding: '12px 0', borderColor: 'var(--border)', display: 'flex' }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="row between">
          <span className="title">{dueMonthLabelWithYear(invoice.referenceMonth)}</span>
          <Badge kind={invoiceStatusBadgeKind(invoice.status)} dot={false} square>
            {INVOICE_STATUS_LABELS[invoice.status]}
          </Badge>
        </div>
        <div className="meta">
          {invoice.itemCount} {invoice.itemCount === 1 ? 'lançamento' : 'lançamentos'}
          {invoice.importedItemCount > 0 && ` · ${invoice.importedItemCount} importados`}
        </div>
      </div>
      <div className="amount mono" style={{ alignSelf: 'center' }}>
        <Money value={parseFloat(invoice.totalAmount)} />
      </div>
    </Link>
  )
}

export default function InvoicesPage() {
  const { data: cards, isLoading: cardsLoading } = useCards()
  const [cardId, setCardId] = useState<string | null>(null)
  const isMobile = useMediaQuery(MOBILE_QUERY)

  const activeCards = useMemo(() => cards?.filter((c) => !c.archivedAt) ?? [], [cards])

  useEffect(() => {
    if (!cardId && activeCards.length > 0) {
      setCardId(activeCards[0].id)
    }
  }, [activeCards, cardId])

  const { data: invoices, isLoading, isError, refetch } = useInvoices(cardId ?? '')

  return (
    <div>
      <div className="page-h">
        <div>
          <h1 className="title">Faturas</h1>
          <div className="desc">Histórico de faturas por cartão, com correção de lançamentos.</div>
        </div>
        <div className="spacer" />
        <div className="actions">
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

      {!cardId ? (
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          {cardsLoading ? 'Carregando…' : 'Cadastre um cartão para ver o histórico de faturas.'}
        </p>
      ) : isLoading ? (
        <InvoicesSkeleton />
      ) : isError ? (
        <div role="alert" style={{ marginBottom: 24 }}>
          <p style={{ color: 'var(--expense)', fontSize: 13, marginBottom: 8 }}>
            Erro ao carregar faturas.
          </p>
          <button className="btn btn-ghost btn-sm" onClick={() => void refetch()}>
            Tentar novamente
          </button>
        </div>
      ) : !invoices || invoices.content.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Nenhuma fatura encontrada para este cartão.
        </p>
      ) : isMobile ? (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {invoices.content.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} />
          ))}
        </div>
      ) : (
        <div className="card flush">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Situação</th>
                  <th className="num">Total</th>
                  <th className="num">Pago</th>
                  <th>Lançamentos</th>
                  <th style={{ width: 32 }} />
                </tr>
              </thead>
              <tbody>
                {invoices.content.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{dueMonthLabelWithYear(invoice.referenceMonth)}</td>
                    <td>
                      <Badge kind={invoiceStatusBadgeKind(invoice.status)} dot={false} square>
                        {INVOICE_STATUS_LABELS[invoice.status]}
                      </Badge>
                    </td>
                    <td className="num mono">
                      <Money value={parseFloat(invoice.totalAmount)} />
                    </td>
                    <td className="num mono">
                      <Money value={parseFloat(invoice.paidAmount)} />
                    </td>
                    <td>
                      {invoice.itemCount}
                      {invoice.importedItemCount > 0 &&
                        ` · ${invoice.importedItemCount} importados`}
                    </td>
                    <td>
                      <Link
                        to={invoiceHref(invoice)}
                        aria-label={`Abrir fatura de ${dueMonthLabelWithYear(invoice.referenceMonth)}`}
                        style={{ display: 'flex', color: 'var(--text-dim)' }}
                      >
                        <ChevronRight size={16} aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
