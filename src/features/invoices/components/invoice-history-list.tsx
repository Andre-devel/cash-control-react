import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Money } from '@/components/ui/money'
import { invoiceLabel } from '@/features/cards/utils/invoice-month'
import { InvoiceStatusBadge } from '@/features/invoices/components/invoice-status-badge'
import { ROUTES } from '@/app/router/routes'
import type { InvoiceSummary } from '@/features/invoices/types'
import { formatLocalDate } from '@/lib/format-date'

function invoiceHref(invoice: InvoiceSummary) {
  return ROUTES.INVOICE_DETAIL.replace(':invoiceId', invoice.id)
}

/** "4 itens", ou "4 itens · 3 importados" quando parte veio do PDF. */
function itemCountLabel(invoice: InvoiceSummary): string {
  const count = `${invoice.itemCount} ${invoice.itemCount === 1 ? 'item' : 'itens'}`
  if (invoice.importedItemCount === 0) return count
  return `${count} · ${invoice.importedItemCount} ${invoice.importedItemCount === 1 ? 'importado' : 'importados'}`
}

interface InvoiceHistoryListProps {
  invoices: InvoiceSummary[]
  /** Nome do cartão nos cards do celular (a lista de faturas mistura o contexto). */
  cardName?: string
}

/**
 * Histórico de faturas: tabela densa a partir de 1024 px, cards abaixo disso. As duas
 * variantes ficam no DOM e a escondida sai com `display: none` — fora da árvore de
 * acessibilidade, então o leitor de tela lê uma só.
 */
export function InvoiceHistoryList({ invoices, cardName }: InvoiceHistoryListProps) {
  const navigate = useNavigate()

  return (
    <>
      {/* Celular e tablet: cards */}
      <ul className="m-0 flex list-none flex-col gap-2 p-0 lg:hidden">
        {invoices.map((invoice) => (
          <li key={invoice.id}>
            <Link
              to={invoiceHref(invoice)}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-1 p-3.5 text-fg no-underline transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-label={`Fatura de ${invoiceLabel(invoice.dueDate)}`}
            >
              <span className="flex items-center gap-3">
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-body font-semibold leading-none">
                    {invoiceLabel(invoice.dueDate)}
                  </span>
                  {cardName && (
                    <span className="truncate text-caption text-fg-muted">{cardName}</span>
                  )}
                </span>
                <InvoiceStatusBadge status={invoice.status} />
              </span>
              <span className="grid grid-cols-3 gap-2 tabular-nums">
                <span className="flex flex-col gap-1">
                  <span className="text-[11px] text-fg-muted">Total</span>
                  <span className="text-body-sm font-bold">
                    <Money value={parseFloat(invoice.totalAmount)} />
                  </span>
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-[11px] text-fg-muted">Pago</span>
                  <span className="text-body-sm font-medium">
                    <Money value={parseFloat(invoice.paidAmount)} />
                  </span>
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-[11px] text-fg-muted">Vence</span>
                  <span className="text-body-sm font-medium">
                    {formatLocalDate(invoice.dueDate)}
                  </span>
                </span>
              </span>
              <span className="font-mono text-[11px] text-fg-subtle">
                fecha {formatLocalDate(invoice.closingDate)} · {itemCountLabel(invoice)}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop: tabela */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface-1 lg:block">
        <table className="tbl">
          <thead>
            <tr>
              <th>Referência</th>
              <th>Status</th>
              <th>Fechamento</th>
              <th>Vencimento</th>
              <th className="num">Pago</th>
              <th className="num">Total</th>
              <th style={{ width: 44 }}>
                <span className="sr-only">Abrir</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                onClick={() => navigate(invoiceHref(invoice))}
                className="cursor-pointer"
              >
                <td>
                  <span className="flex flex-col gap-1">
                    <span className="text-body font-semibold leading-none">
                      {invoiceLabel(invoice.dueDate)}
                    </span>
                    <span className="text-caption text-fg-muted">{itemCountLabel(invoice)}</span>
                  </span>
                </td>
                <td>
                  <InvoiceStatusBadge status={invoice.status} />
                </td>
                <td className="tabular-nums text-fg-muted">
                  {formatLocalDate(invoice.closingDate)}
                </td>
                <td className="tabular-nums">{formatLocalDate(invoice.dueDate)}</td>
                <td className="num tabular-nums text-fg-muted">
                  <Money value={parseFloat(invoice.paidAmount)} />
                </td>
                <td className="num font-semibold tabular-nums">
                  <Money value={parseFloat(invoice.totalAmount)} />
                </td>
                <td>
                  <Link
                    to={invoiceHref(invoice)}
                    aria-label={`Abrir fatura de ${invoiceLabel(invoice.dueDate)}`}
                    className="flex min-h-touch min-w-touch items-center justify-center rounded-sm text-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ChevronRight size={16} aria-hidden="true" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
