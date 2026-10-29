import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/ui/money'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { flattenCategories } from '@/features/categories/utils/flatten-categories'
import type { Card, Invoice } from '@/features/cards/types'
import { canPayInvoice, dueBadge } from '@/features/invoices/utils/invoice-status'
import { InvoiceStatusBadge } from '@/features/invoices/components/invoice-status-badge'
import { InvoiceItemRow } from '@/features/invoices/components/invoice-item-row'
import {
  dueMonthLabel,
  getCurrentInvoiceMonth,
  shiftMonth,
} from '@/features/cards/utils/invoice-month'
import { ROUTES } from '@/app/router/routes'
import { formatLocalDate } from '@/lib/format-date'
import { categoryColorCss } from '@/features/categories/utils/category-colors'

interface InvoiceCardProps {
  card: Card
  invoice: Invoice | undefined
  invoiceLoading: boolean
  referenceMonth: string
  onMonthChange: (month: string) => void
  onPay: () => void
}

export function InvoiceCard({
  card,
  invoice,
  invoiceLoading,
  referenceMonth,
  onMonthChange,
  onPay,
}: InvoiceCardProps) {
  const { data: categories } = useCategories()
  // A árvore de categorias precisa ser achatada, senão o lookup por id
  // nunca encontra subcategorias.
  const flatCategories = useMemo(() => flattenCategories(categories ?? []), [categories])

  const currentMonth = getCurrentInvoiceMonth(card)
  // O rótulo é o mês do vencimento, não o do fechamento: é assim que o emissor nomeia a
  // fatura, e a chave que vai para a API continua sendo o mês de fechamento. A aba corrente
  // diz o mês também — rotulada só como "Atual", ela escondia o seu, e as vizinhas pareciam
  // pular um mês.
  const tabs = [-2, -1, 0, 1].map((offset) => {
    const key = shiftMonth(currentMonth, offset)
    return {
      key,
      label: offset === 0 ? `${dueMonthLabel(key, card)} · Atual` : dueMonthLabel(key, card),
    }
  })

  const closesAtDay = String(card.closingDay).padStart(2, '0')
  const closesAt = invoice?.closingDate ?? `${referenceMonth}-${closesAtDay}`

  const due = invoice ? dueBadge(invoice) : null

  const totalAmount = invoice ? parseFloat(invoice.totalAmount) : 0
  const paidAmount = invoice ? parseFloat(invoice.paidAmount) : 0
  const remainingAmount = totalAmount - paidAmount
  const paidPct = totalAmount > 0 ? Math.min(100, (paidAmount / totalAmount) * 100) : 0

  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface-1">
      <header className="flex flex-col gap-3 border-b border-border p-4 md:p-5 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          <h3 className="m-0 font-display text-h2 font-bold">Fatura — {card.name}</h3>
          {invoice && (
            <p className="m-0 mt-1 text-body-sm text-fg-muted">
              Fecha em {formatLocalDate(closesAt)} · Vence em {formatLocalDate(invoice.dueDate)}
            </p>
          )}
        </div>
        <div className="-mx-1 overflow-x-auto px-1">
          <div className="tabs w-max" role="tablist" aria-label="Mês da fatura">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={referenceMonth === t.key}
                className={referenceMonth === t.key ? 'on' : undefined}
                onClick={() => onMonthChange(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="p-4 md:p-5">
        {invoiceLoading ? (
          <div
            className="flex animate-pulse flex-col gap-3"
            aria-busy="true"
            aria-label="Carregando fatura"
          >
            <div className="h-10 w-44 rounded-sm bg-surface-3" />
            <div className="h-2 rounded-full bg-surface-3" />
            <div className="h-2 w-3/5 rounded-full bg-surface-3" />
          </div>
        ) : invoice ? (
          <>
            <div className="flex flex-col gap-4 rounded-xl bg-surface-2 p-4 md:flex-row md:items-end md:gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <InvoiceStatusBadge status={invoice.status} />
                  {due && invoice.status !== 'PAID' && (
                    <Badge kind={due.kind} dot={false}>
                      {due.label}
                    </Badge>
                  )}
                </div>
                <span className="text-body-sm text-fg-muted">Valor total</span>
                <span className="font-display text-amount-lg font-extrabold tabular-nums">
                  <Money value={totalAmount} />
                </span>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-caption text-fg-muted tabular-nums">
                  <span>
                    Pago: <Money value={paidAmount} />
                  </span>
                  <span>
                    Restante:{' '}
                    <span
                      className={`font-semibold ${remainingAmount > 0 ? 'text-pending' : 'text-paid'}`}
                    >
                      <Money value={remainingAmount} />
                    </span>
                  </span>
                </div>
                <div
                  className="bar"
                  role="progressbar"
                  aria-label="Fatura paga"
                  aria-valuenow={Math.round(paidPct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <i style={{ width: `${paidPct}%`, background: 'rgb(var(--cc-paid))' }} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" asChild className="min-h-touch">
                  <Link to={ROUTES.INVOICE_DETAIL.replace(':invoiceId', invoice.id)}>
                    Ver fatura
                    <ChevronRight size={14} aria-hidden="true" />
                  </Link>
                </Button>
                {canPayInvoice(invoice) && (
                  <Button
                    variant="primary"
                    className="min-h-touch"
                    onClick={onPay}
                    leading={<Check size={14} />}
                  >
                    Pagar fatura
                  </Button>
                )}
              </div>
            </div>

            <div className="mb-1 mt-5 flex items-center justify-between">
              <h4 className="m-0 text-body font-semibold">Lançamentos ({invoice.items.length})</h4>
            </div>
            {invoice.items.length === 0 ? (
              <p className="m-0 py-4 text-body-sm text-fg-muted">
                Nenhum lançamento neste período.
              </p>
            ) : (
              <div>
                {invoice.items.map((item) => {
                  const cat = flatCategories.find((c) => c.id === item.categoryId)
                  return (
                    <InvoiceItemRow
                      key={item.id}
                      item={item}
                      categoryLabel={
                        item.subcategoryName ?? item.categoryName ?? cat?.name ?? 'Sem categoria'
                      }
                      categoryColor={cat?.color ? categoryColorCss(cat.color) : undefined}
                    />
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <p className="m-0 text-body-sm text-fg-muted">
            Nenhuma fatura encontrada para este período.
          </p>
        )}
      </div>
    </section>
  )
}
