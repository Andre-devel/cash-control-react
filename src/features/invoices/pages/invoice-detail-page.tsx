import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Check, Pencil, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IconBubble } from '@/components/ui/icon-bubble'
import { Money } from '@/components/ui/money'
import { useCard } from '@/features/cards/hooks/use-card'
import { PayInvoiceDialog } from '@/features/cards/components/pay-invoice-dialog'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { flattenCategories } from '@/features/categories/utils/flatten-categories'
import { useInvoiceDetail } from '@/features/invoices/hooks/use-invoice-detail'
import { useSettleInvoice } from '@/features/invoices/hooks/use-settle-invoice'
import { useReopenInvoice } from '@/features/invoices/hooks/use-reopen-invoice'
import { EditInvoiceItemDialog } from '@/features/invoices/components/edit-invoice-item-dialog'
import { dueMonthLabelWithYear } from '@/features/cards/utils/invoice-month'
import {
  INVOICE_STATUS_LABELS,
  invoiceStatusBadgeKind,
} from '@/features/invoices/utils/invoice-status'
import { ROUTES } from '@/app/router/routes'
import type { InvoiceItem } from '@/features/invoices/types'

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function DetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Carregando fatura">
      <div style={{ height: 24, width: 200, borderRadius: 6, background: 'var(--surface-3)' }} />
      <div style={{ height: 120, borderRadius: 8, background: 'var(--surface-3)' }} />
    </div>
  )
}

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const [payOpen, setPayOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InvoiceItem | null>(null)

  const { data: invoice, isLoading, isError, refetch } = useInvoiceDetail(invoiceId ?? '')
  const { data: card } = useCard(invoice?.creditCardId ?? '')
  const { data: categories } = useCategories()
  const flatCategories = useMemo(() => flattenCategories(categories ?? []), [categories])
  const { mutate: settle, isPending: isSettling } = useSettleInvoice()
  const { mutate: reopen, isPending: isReopening } = useReopenInvoice()

  const totalAmount = invoice ? parseFloat(invoice.totalAmount) : 0
  const paidAmount = invoice ? parseFloat(invoice.paidAmount) : 0
  const remainingAmount = totalAmount - paidAmount

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to={ROUTES.INVOICES}>&larr; Faturas</Link>
        </Button>
      </div>

      <h1 className="fw-700" style={{ fontSize: 24, letterSpacing: '-0.01em' }}>
        Fatura{card ? ` — ${card.name}` : ''}
      </h1>

      {isLoading ? (
        <DetailSkeleton />
      ) : isError || !invoice ? (
        <div className="space-y-2" role="alert">
          <p className="text-sm" style={{ color: 'var(--expense)' }}>
            Falha ao carregar fatura.
          </p>
          <Button variant="ghost" size="sm" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="card-h">
              <div>
                <h3>{dueMonthLabelWithYear(invoice.referenceMonth)}</h3>
                <div className="sub">
                  Fecha em {fmtDate(invoice.closingDate ?? invoice.dueDate)} · Vence em{' '}
                  {fmtDate(invoice.dueDate)}
                </div>
              </div>
              <Badge kind={invoiceStatusBadgeKind(invoice.status)} dot={false} square>
                {INVOICE_STATUS_LABELS[invoice.status]}
              </Badge>
            </div>
            <div className="card-b space-y-4">
              <div className="mini-stats">
                <div className="mini-stat">
                  <div className="mini-stat-label">Total</div>
                  <div className="mini-stat-value mono">
                    <Money value={totalAmount} />
                  </div>
                </div>
                <div className="mini-stat">
                  <div className="mini-stat-label">Pago</div>
                  <div className="mini-stat-value mono" style={{ color: 'var(--paid)' }}>
                    <Money value={paidAmount} />
                  </div>
                </div>
                <div className="mini-stat">
                  <div className="mini-stat-label">Restante</div>
                  <div
                    className="mini-stat-value mono"
                    style={{ color: remainingAmount > 0 ? 'var(--pending)' : 'var(--paid)' }}
                  >
                    <Money value={remainingAmount} />
                  </div>
                </div>
              </div>

              <div className="col gap-2">
                <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                  {remainingAmount > 0 && (
                    <Button
                      variant="primary"
                      leading={<Check size={14} />}
                      disabled={!card}
                      onClick={() => setPayOpen(true)}
                    >
                      Pagar fatura
                    </Button>
                  )}
                  {invoice.status !== 'PAID' && (
                    <Button
                      leading={<Check size={14} />}
                      disabled={isSettling}
                      aria-busy={isSettling}
                      onClick={() => settle(invoice.id)}
                    >
                      Marcar como paga
                    </Button>
                  )}
                  {invoice.status === 'PAID' && invoice.paidWithoutTransaction && (
                    <Button
                      variant="ghost"
                      leading={<RotateCcw size={14} />}
                      disabled={isReopening}
                      aria-busy={isReopening}
                      onClick={() => reopen(invoice.id)}
                    >
                      Reabrir fatura
                    </Button>
                  )}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  <strong>Pagar fatura</strong> lança a despesa numa conta e baixa o saldo.{' '}
                  <strong>Marcar como paga</strong> só quita a fatura — para um histórico já
                  liquidado fora do app; as compras seguem pendentes e o saldo não muda.
                </p>
              </div>
            </div>
          </div>

          <div className="card flush">
            <div className="card-h">
              <h3>Lançamentos ({invoice.items.length})</h3>
            </div>
            {invoice.items.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-dim)', padding: '16px' }}>
                Nenhum lançamento neste período.
              </p>
            ) : (
              <div className="tbl-wrap invoice-items-tbl-wrap">
                <table className="tbl invoice-items-tbl">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th>Parcela</th>
                      <th className="num">Valor</th>
                      <th style={{ width: 44 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => {
                      const cat = flatCategories.find((c) => c.id === item.categoryId)
                      const showsOriginal =
                        Boolean(item.originalDescription) &&
                        item.originalDescription !== item.description
                      return (
                        <tr key={item.id}>
                          <td className="cell-date">{fmtDate(item.competenceDate)}</td>
                          <td className="cell-desc">
                            <div className="row gap-2" style={{ alignItems: 'center' }}>
                              <span>{item.description}</span>
                              <Badge kind="muted" square dot={false}>
                                {item.imported ? 'importada' : 'manual'}
                              </Badge>
                            </div>
                            {showsOriginal && (
                              <div
                                style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}
                              >
                                {item.originalDescription}
                              </div>
                            )}
                          </td>
                          <td className="cell-cat">
                            <span className="row gap-2" style={{ alignItems: 'center' }}>
                              <IconBubble
                                color={cat?.color ?? 'var(--text-muted)'}
                                size="sm"
                                glyph={cat?.name?.[0]?.toUpperCase() ?? '?'}
                              />
                              {item.subcategoryName ?? item.categoryName ?? '—'}
                            </span>
                          </td>
                          <td className="cell-meta">
                            {item.installmentNumber && item.totalInstallments
                              ? `${item.installmentNumber}/${item.totalInstallments}`
                              : '—'}
                          </td>
                          <td className="cell-amount num mono">
                            <Money value={parseFloat(item.amount)} />
                          </td>
                          <td className="cell-action">
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Editar lançamento ${item.description}`}
                              onClick={() => setEditingItem(item)}
                            >
                              <Pencil size={14} aria-hidden="true" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {card && (
            <PayInvoiceDialog
              invoice={invoice}
              cardName={card.name}
              open={payOpen}
              onClose={() => setPayOpen(false)}
            />
          )}

          <EditInvoiceItemDialog
            item={editingItem}
            open={editingItem !== null}
            onClose={() => setEditingItem(null)}
          />
        </>
      )}
    </div>
  )
}
