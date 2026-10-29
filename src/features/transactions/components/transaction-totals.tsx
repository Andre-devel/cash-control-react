import type { ComponentType } from 'react'
import { ArrowDownLeft, ArrowUpRight, Receipt, Scale } from 'lucide-react'
import { Money } from '@/components/ui/money'
import type { TransactionTotals as Totals } from '@/features/transactions/types'

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
}

function TotalCard({
  icon: Icon,
  iconClass,
  label,
  value,
  valueClass,
  sub,
  loading,
}: TotalCardProps) {
  return (
    <div className="flex min-w-[150px] shrink-0 flex-col gap-2 rounded-xl border border-border bg-surface-1 p-3.5 md:min-w-0 xl:p-4">
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
      <span className="text-[11px] leading-none text-fg-muted xl:text-caption">
        {loading ? ' ' : sub}
      </span>
    </div>
  )
}

interface TransactionTotalsProps {
  totals: Totals | undefined
  loading: boolean
  periodText: string
}

/**
 * Totais do filtro inteiro (todas as páginas), no topo da lista. No celular a fileira rola
 * na horizontal; do tablet em diante são quatro colunas.
 */
export function TransactionTotals({ totals, loading, periodText }: TransactionTotalsProps) {
  const income = Number(totals?.incomeAmount ?? 0)
  const expense = Number(totals?.expenseAmount ?? 0)
  const invoicePayments = Number(totals?.invoicePaymentAmount ?? 0)
  const net = Number(totals?.netAmount ?? 0)

  return (
    <section
      aria-label="Totais do filtro"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 xl:gap-3"
    >
      <TotalCard
        icon={ArrowDownLeft}
        iconClass="text-income"
        label="Receitas"
        value={Math.abs(income)}
        valueClass="text-income"
        sub={countLabel(totals?.incomeCount ?? 0)}
        loading={loading}
      />
      <TotalCard
        icon={ArrowUpRight}
        iconClass="text-expense"
        label="Despesas"
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
