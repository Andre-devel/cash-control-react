import { useMemo, useState, type ReactNode } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Check, CircleCheck, ChevronLeft, FileUp, Pencil, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/ui/money'
import { IconBubble } from '@/components/ui/icon-bubble'
import { useCard } from '@/features/cards/hooks/use-card'
import { PayInvoiceDialog } from '@/features/cards/components/pay-invoice-dialog'
import { ImportFaturaDialog } from '@/features/cards/components/import-fatura-dialog'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { flattenCategories } from '@/features/categories/utils/flatten-categories'
import { useInvoiceDetail } from '@/features/invoices/hooks/use-invoice-detail'
import { useSettleInvoice } from '@/features/invoices/hooks/use-settle-invoice'
import { useReopenInvoice } from '@/features/invoices/hooks/use-reopen-invoice'
import { EditInvoiceItemDialog } from '@/features/invoices/components/edit-invoice-item-dialog'
import { InvoiceStatusBadge } from '@/features/invoices/components/invoice-status-badge'
import { InvoiceItemMarks, InvoiceItemRow } from '@/features/invoices/components/invoice-item-row'
import { invoiceLabel } from '@/features/cards/utils/invoice-month'
import { canPayInvoice, canSettleInvoice } from '@/features/invoices/utils/invoice-status'
import { installmentLabel, originalDescriptionOf } from '@/features/invoices/utils/invoice-item'
import { ROUTES } from '@/app/router/routes'
import type { InvoiceItem } from '@/features/invoices/types'
import { formatLocalDate } from '@/lib/format-date'
import { categoryColorCss } from '@/features/categories/utils/category-colors'

/** Tom do brilho do cabeçalho, acompanhando a situação. */
const HEADER_GLOW: Record<string, string> = {
  OPEN: '--cc-info',
  CLOSED: '--cc-pending',
  PARTIAL: '--cc-pending',
  PAID: '--cc-paid',
  OVERDUE: '--cc-overdue',
}

function DetailSkeleton() {
  return (
    <div
      className="flex animate-pulse flex-col gap-4"
      aria-busy="true"
      aria-label="Carregando fatura"
    >
      <div className="h-6 w-52 rounded-sm bg-surface-3" />
      <div className="h-44 rounded-2xl bg-surface-3" />
      <div className="h-64 rounded-2xl bg-surface-3" />
    </div>
  )
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="text-[11px] text-fg-muted">{label}</dt>
      <dd className="m-0 text-body-sm font-semibold tabular-nums">{children}</dd>
    </div>
  )
}

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const [payOpen, setPayOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
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
  const importedCount = invoice?.items.filter((item) => item.imported).length ?? 0
  const itemCount = invoice?.items.length ?? 0
  const countLabel = `${itemCount} ${itemCount === 1 ? 'item' : 'itens'}${
    importedCount > 0
      ? ` · ${importedCount} ${importedCount === 1 ? 'importado' : 'importados'}`
      : ''
  }`

  function categoryOf(item: InvoiceItem) {
    const cat = flatCategories.find((c) => c.id === item.categoryId)
    return {
      label: item.subcategoryName ?? item.categoryName ?? cat?.name ?? 'Sem categoria',
      color: cat?.color,
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho: trilha, cartão e título */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="min-w-0 flex-1">
          <nav aria-label="Trilha" className="mb-1 flex items-center text-body-sm text-fg-muted">
            <Link
              to={ROUTES.INVOICES}
              className="inline-flex min-h-touch items-center gap-1 text-fg-muted no-underline hover:text-fg"
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Faturas
            </Link>
          </nav>
          {card && <p className="m-0 mb-1 text-caption text-fg-muted">{card.name}</p>}
          <h1 className="m-0 font-display text-h1 font-extrabold">
            {invoice ? `Fatura ${invoiceLabel(invoice.dueDate)}` : 'Fatura'}
            {card ? <span className="sr-only"> — {card.name}</span> : null}
          </h1>
        </div>
        {invoice && (
          <Button
            className="min-h-touch self-start md:self-auto"
            leading={<FileUp size={14} />}
            onClick={() => setImportOpen(true)}
          >
            Importar PDF
          </Button>
        )}
      </div>

      {isLoading ? (
        <DetailSkeleton />
      ) : isError || !invoice ? (
        <div className="flex flex-col items-start gap-2" role="alert">
          <p className="m-0 text-body-sm text-expense">Falha ao carregar fatura.</p>
          <Button variant="ghost" size="sm" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          {/* Estado "paga" */}
          {invoice.status === 'PAID' && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-2xl border border-paid/30 bg-paid-soft p-4 text-fg"
            >
              <CircleCheck size={20} className="mt-0.5 shrink-0 text-paid" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <strong className="text-body">Esta fatura já está paga</strong>
                <span className="text-body-sm text-fg-muted">
                  {invoice.paidWithoutTransaction ? (
                    <>
                      Marcada como paga sem lançar o pagamento numa conta. Itens podem ser editados;
                      para registrar o pagamento, reabra a fatura.
                    </>
                  ) : (
                    <>
                      Pago <Money value={paidAmount} />. Itens podem ser editados; pagamentos não.
                    </>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Resumo: total, pago, status e ações */}
          <section
            className="flex flex-col gap-4 rounded-2xl border border-border p-4 md:p-5"
            style={{
              background: `radial-gradient(120% 90% at 100% 0%, rgb(var(${HEADER_GLOW[invoice.status] ?? '--cc-info'}) / .12), rgb(var(${HEADER_GLOW[invoice.status] ?? '--cc-info'}) / 0) 60%), rgb(var(--cc-surface-1))`,
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <InvoiceStatusBadge status={invoice.status} />
              <span className="font-mono text-caption text-fg-muted">{countLabel}</span>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-1.5">
                <span className="text-body-sm text-fg-muted">Total da fatura</span>
                <span className="font-display text-[38px] font-extrabold leading-none tracking-tight tabular-nums">
                  <Money value={totalAmount} />
                </span>
              </div>

              <div className="flex flex-col gap-2 lg:items-end">
                <div className="flex flex-wrap gap-2">
                  {canSettleInvoice(invoice) && (
                    <Button
                      className="min-h-touch"
                      leading={<Check size={14} />}
                      loading={isSettling}
                      onClick={() => settle(invoice.id)}
                    >
                      Marcar como paga
                    </Button>
                  )}
                  {canPayInvoice(invoice) && (
                    <Button
                      variant="primary"
                      className="min-h-touch"
                      leading={<Check size={14} />}
                      disabled={!card}
                      onClick={() => setPayOpen(true)}
                    >
                      Pagar fatura
                    </Button>
                  )}
                  {invoice.status === 'PAID' && invoice.paidWithoutTransaction && (
                    <Button
                      variant="ghost"
                      className="min-h-touch"
                      leading={<RotateCcw size={14} />}
                      loading={isReopening}
                      onClick={() => reopen(invoice.id)}
                    >
                      Reabrir fatura
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <dl className="m-0 grid grid-cols-2 gap-3 border-t border-border pt-3.5 sm:grid-cols-4">
              <Stat label="Pago">
                <span className="text-paid">
                  <Money value={paidAmount} />
                </span>
              </Stat>
              <Stat label="Restante">
                <span className={remainingAmount > 0 ? 'text-pending' : 'text-paid'}>
                  <Money value={remainingAmount} />
                </span>
              </Stat>
              <Stat label="Fechamento">
                {formatLocalDate(invoice.closingDate ?? invoice.dueDate)}
              </Stat>
              <Stat label="Vencimento">{formatLocalDate(invoice.dueDate)}</Stat>
            </dl>

            {invoice.status !== 'PAID' && (canPayInvoice(invoice) || canSettleInvoice(invoice)) && (
              <p className="m-0 text-caption text-fg-muted">
                <strong className="text-fg">Pagar fatura</strong> lança a despesa numa conta e baixa
                o saldo. <strong className="text-fg">Marcar como paga</strong> só quita a fatura —
                para um histórico já liquidado fora do app; as compras ficam pagas e o saldo não
                muda. Só depois do fechamento.
              </p>
            )}
          </section>

          {/* Itens */}
          <section className="flex flex-col gap-3">
            <h2 className="m-0 font-display text-h2 font-bold">Itens ({invoice.items.length})</h2>
            {invoice.items.length === 0 ? (
              <p className="m-0 rounded-2xl border border-border bg-surface-1 p-4 text-body-sm text-fg-muted">
                Nenhum lançamento neste período.
              </p>
            ) : (
              <>
                {/* Celular e tablet: cards */}
                <div className="rounded-2xl border border-border bg-surface-1 px-3.5 lg:hidden">
                  {invoice.items.map((item) => {
                    const cat = categoryOf(item)
                    return (
                      <InvoiceItemRow
                        key={item.id}
                        item={item}
                        categoryLabel={cat.label}
                        categoryColor={cat.color ? categoryColorCss(cat.color) : undefined}
                        onEdit={setEditingItem}
                      />
                    )
                  })}
                </div>

                {/* Desktop: tabela */}
                <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface-1 lg:block">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Descrição · original</th>
                        <th>Categoria</th>
                        <th>Data</th>
                        <th>Parcela</th>
                        <th>Marcas</th>
                        <th className="num">Valor</th>
                        <th style={{ width: 52 }}>
                          <span className="sr-only">Editar</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item) => {
                        const cat = categoryOf(item)
                        const original = originalDescriptionOf(item)
                        return (
                          <tr key={item.id}>
                            <td>
                              <span className="flex flex-col gap-1">
                                <span className="text-body-sm font-medium">{item.description}</span>
                                {original ? (
                                  <span
                                    className="max-w-[320px] truncate font-mono text-[11px] text-fg-subtle"
                                    title={original}
                                  >
                                    {original}
                                  </span>
                                ) : !item.imported ? (
                                  <span className="text-[11px] text-fg-subtle">
                                    Lançado manualmente
                                  </span>
                                ) : null}
                              </span>
                            </td>
                            <td>
                              <span className="flex items-center gap-2">
                                <IconBubble
                                  color={
                                    cat.color ? categoryColorCss(cat.color) : 'var(--text-muted)'
                                  }
                                  size="sm"
                                  glyph={(cat.label || item.description)[0]?.toUpperCase() ?? '·'}
                                  aria-hidden
                                />
                                <span className="text-body-sm">{cat.label}</span>
                              </span>
                            </td>
                            <td className="tabular-nums text-fg-muted">
                              {formatLocalDate(item.competenceDate)}
                            </td>
                            <td className="font-mono text-body-sm">
                              {installmentLabel(item) ?? <span className="text-fg-subtle">—</span>}
                            </td>
                            <td>
                              <InvoiceItemMarks item={item} showInstallment={false} />
                            </td>
                            <td className="num font-semibold tabular-nums">
                              <Money value={parseFloat(item.amount)} />
                            </td>
                            <td>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="min-h-touch min-w-touch"
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
              </>
            )}
          </section>

          {card && (
            <PayInvoiceDialog
              invoice={invoice}
              cardName={card.name}
              open={payOpen}
              onClose={() => setPayOpen(false)}
            />
          )}

          <ImportFaturaDialog open={importOpen} onClose={() => setImportOpen(false)} />

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
