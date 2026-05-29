import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IconBubble } from '@/components/ui/icon-bubble'
import { Money } from '@/components/ui/money'
import { useCategories } from '@/features/categories/hooks/use-categories'
import type { Card, Invoice } from '@/features/cards/types'

const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtDateShort(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function getMonthLabel(yyyyMm: string) {
  const [, m] = yyyyMm.split('-').map(Number)
  return MONTH_LABELS[m - 1]
}

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function shiftMonth(yyyyMm: string, delta: number) {
  const [year, month] = yyyyMm.split('-').map(Number)
  const d = new Date(year, month - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
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

  const currentMonth = getCurrentMonth()
  const tabs = [
    { key: currentMonth, label: 'Atual' },
    { key: shiftMonth(currentMonth, -1), label: getMonthLabel(shiftMonth(currentMonth, -1)) },
    { key: shiftMonth(currentMonth, -2), label: getMonthLabel(shiftMonth(currentMonth, -2)) },
  ]

  const closesAtDay = String(card.closingDay).padStart(2, '0')
  const closesAt = invoice?.closingDate ?? `${referenceMonth}-${closesAtDay}`

  const daysUntilDue = invoice
    ? Math.max(0, Math.ceil((new Date(invoice.dueDate).getTime() - Date.now()) / 86400000))
    : 0

  const totalAmount = invoice ? parseFloat(invoice.totalAmount) : 0
  const paidAmount = invoice ? parseFloat(invoice.paidAmount) : 0
  const remainingAmount = invoice ? parseFloat(invoice.remainingAmount) : 0
  const paidPct = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0

  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Fatura — {card.name}</h3>
          {invoice && (
            <div className="sub">
              Período {fmtDateShort(closesAt)} · Fecha em {fmtDate(closesAt)}
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
              className="row gap-6"
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
              <div style={{ textAlign: 'right' }}>
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
                  const cat = categories?.find((c) => c.id === item.categoryId)
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
                          {cat?.name ?? '—'} · {fmtDate(item.date)}
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
