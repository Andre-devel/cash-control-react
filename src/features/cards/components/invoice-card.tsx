import { useMemo } from 'react'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IconBubble } from '@/components/ui/icon-bubble'
import { Money } from '@/components/ui/money'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { flattenCategories } from '@/features/categories/utils/flatten-categories'
import type { Card, Invoice } from '@/features/cards/types'
import {
  dueMonthLabel,
  getCurrentInvoiceMonth,
  shiftMonth,
} from '@/features/cards/utils/invoice-month'

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

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

  const currentMonth = getCurrentInvoiceMonth(card.dueDay)
  // O rótulo é o mês do vencimento, não o do fechamento: é assim que o emissor nomeia a
  // fatura, e a chave que vai para a API continua sendo o mês de fechamento. A aba corrente
  // diz o mês também — rotulada só como "Atual", ela escondia o seu, e as vizinhas pareciam
  // pular um mês.
  const tabs = [-2, -1, 0, 1].map((offset) => {
    const key = shiftMonth(currentMonth, offset)
    return {
      key,
      label: offset === 0 ? `${dueMonthLabel(key)} · Atual` : dueMonthLabel(key),
    }
  })

  const closesAtDay = String(card.closingDay).padStart(2, '0')
  const closesAt = invoice?.closingDate ?? `${referenceMonth}-${closesAtDay}`

  const daysUntilDue = invoice
    ? Math.max(0, Math.ceil((new Date(invoice.dueDate).getTime() - Date.now()) / 86400000))
    : 0

  const totalAmount = invoice ? parseFloat(invoice.totalAmount) : 0
  const paidAmount = invoice ? parseFloat(invoice.paidAmount) : 0
  const remainingAmount = totalAmount - paidAmount
  const paidPct = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0

  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Fatura — {card.name}</h3>
          {invoice && (
            <div className="sub">
              Fecha em {fmtDate(closesAt)} · Vence em {fmtDate(invoice.dueDate)}
            </div>
          )}
        </div>
        <div className="right">
          <div className="tabs" role="tablist" aria-label="Mês da fatura">
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
      </div>

      <div className="card-b">
        {invoiceLoading ? (
          <div
            className="animate-pulse"
            aria-busy="true"
            aria-label="Carregando fatura"
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div
              style={{ height: 40, width: 180, background: 'var(--surface-3)', borderRadius: 6 }}
            />
            <div style={{ height: 8, background: 'var(--surface-3)', borderRadius: 4 }} />
            <div
              style={{ height: 8, width: '60%', background: 'var(--surface-3)', borderRadius: 4 }}
            />
          </div>
        ) : invoice ? (
          <>
            {/* Summary row */}
            <div
              className="row gap-6 invoice-summary"
              style={{ alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}
            >
              <div>
                <div className="text-xs text-dim">Valor total</div>
                <div className="text-3xl mono fw-500" style={{ color: 'var(--text)' }}>
                  <Money value={totalAmount} />
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div className="row between text-xs text-dim mb-2">
                  <span>
                    Pago:{' '}
                    <span className="mono">
                      <Money value={paidAmount} />
                    </span>
                  </span>
                  <span>
                    Restante:{' '}
                    <span
                      className="mono fw-500"
                      style={{
                        color: remainingAmount > 0 ? 'var(--pending)' : 'var(--paid)',
                      }}
                    >
                      <Money value={remainingAmount} />
                    </span>
                  </span>
                </div>
                <div className="bar">
                  <i style={{ width: `${paidPct}%`, background: 'var(--paid)' }} />
                </div>
              </div>
              <div className="invoice-due" style={{ textAlign: 'right' }}>
                <Badge kind={daysUntilDue <= 3 ? 'pending' : 'info'} dot={false}>
                  Vence em {daysUntilDue} {daysUntilDue === 1 ? 'dia' : 'dias'}
                </Badge>
                <div className="text-xs text-dim mt-2">{fmtDate(invoice.dueDate)}</div>
              </div>
              {remainingAmount > 0 && (
                <Button variant="primary" onClick={onPay} leading={<Check size={14} />}>
                  Pagar fatura
                </Button>
              )}
            </div>

            {/* Charges */}
            <div className="row between mb-2 mt-4">
              <div className="text-sm fw-500">Lançamentos ({invoice.items.length})</div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)' }}>
              {invoice.items.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-dim)', padding: '16px 0' }}>
                  Nenhum lançamento neste período.
                </p>
              ) : (
                invoice.items.map((item) => {
                  const cat = flatCategories.find((c) => c.id === item.categoryId)
                  return (
                    <div
                      key={item.id}
                      className="list-row"
                      style={{ padding: '10px 0', borderColor: 'var(--border)' }}
                    >
                      <IconBubble
                        color={cat?.color ?? 'var(--text-muted)'}
                        size="sm"
                        glyph={cat?.name?.[0]?.toUpperCase() ?? '?'}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="title">{item.description}</div>
                        <div className="meta">
                          {cat?.name ?? '—'} · {fmtDate(item.competenceDate)}
                        </div>
                      </div>
                      <div className="amount mono">
                        <Money value={parseFloat(item.amount)} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            Nenhuma fatura encontrada para este período.
          </p>
        )}
      </div>
    </div>
  )
}
