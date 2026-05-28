import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useCard } from '@/features/cards/hooks/use-card'
import { useInvoice } from '@/features/cards/hooks/use-invoice'
import { useLimitUsage } from '@/features/cards/hooks/use-limit-usage'
import { useSpendingBreakdown } from '@/features/cards/hooks/use-spending-breakdown'
import { EditCardDialog } from '@/features/cards/components/edit-card-dialog'
import { RecordChargeDialog } from '@/features/cards/components/record-charge-dialog'
import { PayInvoiceDialog } from '@/features/cards/components/pay-invoice-dialog'
import { ROUTES } from '@/app/router/routes'

const INVOICE_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  CLOSED: 'Closed',
  PAID: 'Paid',
  PARTIALLY_PAID: 'Partially Paid',
}

function formatAmount(amount: string): string {
  const num = parseFloat(amount)
  if (isNaN(num)) return amount
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
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

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function CardDetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading card">
      <div className="h-6 w-48 rounded bg-muted" />
      <div className="h-32 rounded bg-muted" />
    </div>
  )
}

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [referenceMonth, setReferenceMonth] = useState(getCurrentMonth())
  const [editOpen, setEditOpen] = useState(false)
  const [chargeOpen, setChargeOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)

  const spendingFrom = `${referenceMonth}-01`
  const spendingTo = (() => {
    const [y, m] = referenceMonth.split('-').map(Number)
    const lastDay = new Date(y, m, 0).getDate()
    return `${referenceMonth}-${String(lastDay).padStart(2, '0')}`
  })()

  const {
    data: card,
    isLoading: cardLoading,
    isError: cardError,
    refetch: refetchCard,
  } = useCard(id ?? '')
  const { data: invoice, isLoading: invoiceLoading } = useInvoice(id ?? '', referenceMonth)
  const { data: limitUsage } = useLimitUsage(id ?? '')
  const { data: spending } = useSpendingBreakdown(id ?? '', { from: spendingFrom, to: spendingTo })

  const limitPercent = limitUsage
    ? Math.min(
        100,
        Math.round((parseFloat(limitUsage.usedAmount) / parseFloat(limitUsage.creditLimit)) * 100),
      )
    : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to={ROUTES.CARDS}>&larr; Cards</Link>
        </Button>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">{card?.name ?? 'Card'}</h1>

      {cardLoading ? (
        <CardDetailSkeleton />
      ) : cardError ? (
        <div className="space-y-2" role="alert">
          <p className="text-sm text-destructive">Failed to load card.</p>
          <Button variant="outline" size="sm" onClick={() => void refetchCard()}>
            Retry
          </Button>
        </div>
      ) : card ? (
        <>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: card.color }}
                aria-hidden="true"
              />
              <span className="text-sm text-muted-foreground font-mono">
                •••• {card.lastFourDigits}
              </span>
              {card.archived && (
                <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 border border-yellow-500 rounded px-1.5 py-0.5">
                  Archived
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px]"
                onClick={() => setChargeOpen(true)}
              >
                Record Charge
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px]"
                onClick={() => setEditOpen(true)}
              >
                Edit
              </Button>
            </div>
          </div>

          {/* Limit Usage */}
          {limitUsage && (
            <div className="card">
              <div className="card-h">
                <h3>Limit Usage</h3>
              </div>
              <div className="card-b space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Used</span>
                  <span className="font-mono font-semibold">
                    {formatAmount(limitUsage.usedAmount)}
                  </span>
                </div>
                <div
                  className="h-2 rounded-full bg-muted overflow-hidden"
                  role="progressbar"
                  aria-valuenow={limitPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Limit usage"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${limitPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Available: {formatAmount(limitUsage.availableAmount)}</span>
                  <span>Limit: {formatAmount(limitUsage.creditLimit)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Invoice */}
          <div className="card">
            <div className="card-h">
              <h3>Invoice</h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Previous month"
                  onClick={() => setReferenceMonth(getPreviousMonth(referenceMonth))}
                >
                  ‹
                </Button>
                <span className="text-sm font-medium w-20 text-center">{referenceMonth}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Next month"
                  onClick={() => setReferenceMonth(getNextMonth(referenceMonth))}
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
                  aria-label="Loading invoice"
                >
                  <div className="h-4 w-32 rounded bg-muted" />
                  <div className="h-4 w-24 rounded bg-muted" />
                </div>
              ) : invoice ? (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="font-medium">
                        {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-mono font-semibold">{formatAmount(invoice.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Paid</p>
                      <p className="font-mono font-semibold">{formatAmount(invoice.paidAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <p className="font-mono font-semibold text-destructive">
                        {formatAmount(invoice.remainingAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className="font-medium">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {parseFloat(invoice.remainingAmount) > 0 && (
                    <Button size="sm" className="min-h-[44px]" onClick={() => setPayOpen(true)}>
                      Pay Invoice
                    </Button>
                  )}

                  {invoice.items.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Charges</p>
                      <div className="divide-y">
                        {invoice.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between py-2 text-sm"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate">{item.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(item.date).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="font-mono font-semibold ml-4">
                              {formatAmount(item.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No charges for this period.</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No invoice found for this month.</p>
              )}
            </div>
          </div>

          {/* Spending Breakdown */}
          {spending && spending.items.length > 0 && (
            <div className="card">
              <div className="card-h">
                <h3>Spending Breakdown</h3>
              </div>
              <div className="card-b">
                <div className="space-y-2">
                  {spending.items.map((item, i) => (
                    <div
                      key={item.categoryId ?? i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {item.categoryName ?? 'Uncategorized'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{item.percentage}%</span>
                        <span className="font-mono font-semibold">{formatAmount(item.amount)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm border-t pt-2 mt-2">
                    <span className="font-medium">Total</span>
                    <span className="font-mono font-semibold">
                      {formatAmount(spending.totalAmount)}
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
