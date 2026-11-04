import type { ComponentType } from 'react'
import { ArrowDownLeft, ArrowUpRight, Receipt, Scale } from 'lucide-react'
import { Money } from '@/components/ui/money'
import type { TransactionTotals as Totals, TransactionType } from '@/features/transactions/types'

function countLabel(n: number): string {
  return `${n} ${n === 1 ? 'lançamento' : 'lançamentos'}`
}

interface TotalCardProps {
  icon: ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>
  iconClass: string
  label: string
  value: number
  valueClass: string
  sub: string
  loading: boolean
  /** Presente: o card vira um botão que liga/desliga o filtro de tipo correspondente. */
  active?: boolean
  onClick?: () => void
}

function TotalCard({
  icon: Icon,
  iconClass,
  label,
  value,
  valueClass,
  sub,
  loading,
  active,
  onClick,
}: TotalCardProps) {
  const base = 'flex min-w-0 flex-col gap-2 rounded-xl border bg-surface-1 p-3.5 text-left xl:p-4'
  const content = (
    <>
      <span className="flex items-center gap-1.5 text-caption font-medium text-fg-muted">
        <Icon size={14} aria-hidden className={iconClass} />
        {label}
      </span>
      <span
        className={`whitespace-nowrap font-sans text-[17px] font-bold leading-none xl:font-display xl:text-[22px] xl:font-extrabold ${valueClass}`}
        aria-busy={loading}
      >
        {loading ? '—' : <Money value={value} signed />}
      </span>
      <span className="text-[11px] leading-tight text-fg-muted xl:text-caption">
        {loading ? ' ' : sub}
      </span>
    </>
  )

  if (!onClick) return <div className={`${base} border-border`}>{content}</div>

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${base} transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
        active ? 'border-brand' : 'border-border hover:border-border-strong'
      }`}
    >
      {content}
    </button>
  )
}

interface TransactionTotalsProps {
  totals: Totals | undefined
  loading: boolean
  periodText: string
  /** Tipo filtrado agora; o card dele fica marcado. */
  activeType?: TransactionType
  /** Clique num card: filtra pelo tipo dele, ou limpa o filtro se ele já estiver ativo. */
  onTypeChange?: (type: TransactionType | undefined) => void
}

/**
 * Totais do filtro inteiro (todas as páginas), no topo da lista. No celular é uma grade de
 * duas colunas, sem rolagem lateral; um card que sobre sozinho na última linha ocupa a linha
 * inteira. Do tablet em diante são quatro colunas.
 */
export function TransactionTotals({
  totals,
  loading,
  periodText,
  activeType,
  onTypeChange,
}: TransactionTotalsProps) {
  const toggle = (type: TransactionType) =>
    onTypeChange ? () => onTypeChange(activeType === type ? undefined : type) : undefined

  const income = Number(totals?.incomeAmount ?? 0)
  const expense = Number(totals?.expenseAmount ?? 0)
  const invoicePayments = Number(totals?.invoicePaymentAmount ?? 0)
  const net = Number(totals?.netAmount ?? 0)

  return (
    <section
      aria-label="Totais do filtro"
      className="grid grid-cols-2 gap-2 [&>*:last-child:nth-child(odd)]:col-span-2 md:grid-cols-4 md:[&>*:last-child:nth-child(odd)]:col-span-1 xl:gap-3"
    >
      <TotalCard
        icon={ArrowDownLeft}
        iconClass="text-income"
        label="Receitas"
        active={activeType === 'INCOME'}
        onClick={toggle('INCOME')}
        value={Math.abs(income)}
        valueClass="text-income"
        sub={countLabel(totals?.incomeCount ?? 0)}
        loading={loading}
      />
      <TotalCard
        icon={ArrowUpRight}
        iconClass="text-expense"
        label="Despesas"
        active={activeType === 'EXPENSE'}
        onClick={toggle('EXPENSE')}
        value={-Math.abs(expense)}
        valueClass="text-fg"
        sub={countLabel(totals?.expenseCount ?? 0)}
        loading={loading}
      />
      {/* Pagamento de fatura fica fora do resultado: as compras do cartão já contam em
          despesas. Ele aparece à parte porque mesmo assim tira dinheiro da conta. */}
      <TotalCard
        icon={Receipt}
        iconClass="text-info"
        label="Pag. de fatura"
        active={activeType === 'INVOICE_PAYMENT'}
        onClick={toggle('INVOICE_PAYMENT')}
        value={-Math.abs(invoicePayments)}
        valueClass="text-fg"
        sub={`${countLabel(totals?.invoicePaymentCount ?? 0)} · fora do resultado`}
        loading={loading}
      />
      <TotalCard
        icon={Scale}
        iconClass="text-brand-text"
        label="Resultado líquido"
        value={net}
        valueClass={net > 0 ? 'text-income' : 'text-fg'}
        sub={periodText}
        loading={loading}
      />
    </section>
  )
}
