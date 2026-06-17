import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCard } from '@/features/cards/hooks/use-card'
import { useInvoice } from '@/features/cards/hooks/use-invoice'
import { useLimitUsage } from '@/features/cards/hooks/use-limit-usage'
import { useSpendingBreakdown } from '@/features/cards/hooks/use-spending-breakdown'
import { EditCardDialog } from '@/features/cards/components/edit-card-dialog'
import { RecordChargeDialog } from '@/features/cards/components/record-charge-dialog'
import { PayInvoiceDialog } from '@/features/cards/components/pay-invoice-dialog'
import { ROUTES } from '@/app/router/routes'

const INVOICE_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Aberta',
  CLOSED: 'Fechada',
  PAID: 'Paga',
  PARTIALLY_PAID: 'Parcialmente paga',
}

function getBillingCycleMonth(closingDay: number): string {
  const today = new Date()
  const day = today.getDate()
  if (day <= closingDay) {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  } else {
    const next = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
  }
}

function getPreviousMonth(yyyyMm: string): string {
  const [year, month] = yyyyMm.split('-').map(Number)
  const date = new Date(year, month - 2, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getNextMonth(yyyyMm: string): string {
  const [year, month] = yyyyMm.split('-').map(Number)
  const date = new Date(year, month, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function CardDetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Carregando cartão">
      <div className="h-6 w-48 rounded" style={{ background: 'var(--surface-3)' }} />
      <div className="h-32 rounded" style={{ background: 'var(--surface-3)' }} />
    </div>
  )
}

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [referenceMonth, setReferenceMonth] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [chargeOpen, setChargeOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)

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
      setReferenceMonth(getBillingCycleMonth(card.closingDay))
    }
  }, [card, referenceMonth])

  const { data: invoice, isLoading: invoiceLoading } = useInvoice(id ?? '', referenceMonth ?? '')
  const { data: limitUsage } = useLimitUsage(id ?? '')
  const { data: spending } = useSpendingBreakdown(id ?? '', { from: spendingFrom, to: spendingTo })

  const limitPercent = limitUsage
    ? limitUsage.usagePercentage
      ? Math.round(parseFloat(limitUsage.usagePercentage))
      : Math.min(
          100,
          Math.round((parseFloat(limitUsage.usedLimit) / parseFloat(limitUsage.creditLimit)) * 100),
        )
    : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to={ROUTES.CARDS}>&larr; Cartões</Link>
        </Button>
      </div>

      <h1 className="fw-700" style={{ fontSize: 24, letterSpacing: '-0.01em' }}>
        {card?.name ?? 'Card'}
      </h1>

      {cardLoading ? (
        <CardDetailSkeleton />
      ) : cardError ? (
        <div className="space-y-2" role="alert">
          <p className="text-sm" style={{ color: 'var(--expense)' }}>
            Falha ao carregar cartão.
          </p>
          <Button variant="ghost" size="sm" onClick={() => void refetchCard()}>
            Tentar novamente
          </Button>
        </div>
      ) : card ? (
        <>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              {card.archivedAt && (
                <Badge kind="pending" dot={false} square>
                  Arquivado
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px]"
                onClick={() => setChargeOpen(true)}
              >
                Registrar cobrança
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px]"
                onClick={() => setEditOpen(true)}
              >
                Editar
              </Button>
            </div>
          </div>

          {limitUsage && (
            <div className="card">
              <div className="card-h">
                <h3>Uso do limite</h3>
              </div>
              <div className="card-b space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-dim">Utilizado</span>
                  <span className="mono fw-600">{limitUsage.usedLimit}</span>
                </div>
                <div
                  className="bar"
                  role="progressbar"
                  aria-valuenow={limitPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Uso do limite"
                >
                  <i style={{ width: `${limitPercent}%`, background: 'var(--accent)' }} />
                </div>
                <div className="flex justify-between text-xs text-dim">
                  <span>Disponível: {limitUsage.availableLimit}</span>
                  <span>Limite: {limitUsage.creditLimit}</span>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-h">
              <h3>Fatura</h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Mês anterior"
                  onClick={() =>
                    referenceMonth && setReferenceMonth(getPreviousMonth(referenceMonth))
                  }
                >
                  ‹
                </Button>
                <span className="text-sm fw-500" style={{ width: 80, textAlign: 'center' }}>
                  {referenceMonth ?? '—'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Próximo mês"
                  onClick={() => referenceMonth && setReferenceMonth(getNextMonth(referenceMonth))}
                >
                  ›
                </Button>
              </div>
            </div>
            <div className="card-b space-y-4">
              {invoiceLoading ? (
                <div
                  className="space-y-2 animate-pulse"
                  aria-busy="true"
                  aria-label="Carregando fatura"
                >
                  <div className="h-4 w-32 rounded" style={{ background: 'var(--surface-3)' }} />
                  <div className="h-4 w-24 rounded" style={{ background: 'var(--surface-3)' }} />
                </div>
              ) : invoice ? (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-dim">Situação</p>
                      <p className="fw-500">
                        {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-dim">Total</p>
                      <p className="mono fw-600">{invoice.totalAmount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-dim">Pago</p>
                      <p className="mono fw-600">{invoice.paidAmount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-dim">Restante</p>
                      <p className="mono fw-600" style={{ color: 'var(--expense)' }}>
                        {(parseFloat(invoice.totalAmount) - parseFloat(invoice.paidAmount)).toFixed(
                          2,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-dim">Vencimento</p>
                      <p className="fw-500">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {parseFloat(invoice.totalAmount) - parseFloat(invoice.paidAmount) > 0 && (
                    <Button size="sm" className="min-h-[44px]" onClick={() => setPayOpen(true)}>
                      Pagar fatura
                    </Button>
                  )}

                  {invoice.items.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm fw-500">Cobranças</p>
                      <div className="divide-y">
                        {invoice.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between py-2 text-sm"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate">{item.description}</p>
                              <p className="text-xs text-dim">
                                {new Date(item.competenceDate).toLocaleDateString()}
                                {item.installmentNumber && item.totalInstallments
                                  ? ` · Parcela ${item.installmentNumber}/${item.totalInstallments}`
                                  : ''}
                              </p>
                            </div>
                            <span className="mono fw-600 ml-4">{item.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-dim">Nenhuma cobrança neste período.</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-dim">Nenhuma fatura encontrada para este mês.</p>
              )}
            </div>
          </div>

          {spending && spending.length > 0 && (
            <div className="card">
              <div className="card-h">
                <h3>Resumo de gastos</h3>
              </div>
              <div className="card-b">
                <div className="space-y-2">
                  {spending.map((item, i) => (
                    <div
                      key={item.categoryId ?? i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-dim">{item.categoryName ?? 'Sem categoria'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-dim">{item.percentage}%</span>
                        <span className="mono fw-600">{item.totalAmount}</span>
                      </div>
                    </div>
                  ))}
                  <div
                    className="flex items-center justify-between text-sm"
                    style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8 }}
                  >
                    <span className="fw-500">Total</span>
                    <span className="mono fw-600">
                      {spending
                        .reduce((sum, item) => sum + parseFloat(item.totalAmount), 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <EditCardDialog card={card} open={editOpen} onClose={() => setEditOpen(false)} />
          <RecordChargeDialog
            cardId={card.id}
            open={chargeOpen}
            onClose={() => setChargeOpen(false)}
          />
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
