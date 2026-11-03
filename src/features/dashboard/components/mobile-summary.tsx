import { TrendingDown, TrendingUp } from 'lucide-react'
import { Amount } from './amount'
import { SkeletonBlock } from './panel'
import type { SummaryDelta } from './month-summary'

interface MobileSummaryProps {
  status: 'loading' | 'error' | 'ready'
  onRetry?: () => void
  monthName: string
  income: number
  expenses: number
  /** Patrimônio com as aplicações pelo líquido de IR/IOF, sem descontar faturas. */
  netWorth: number
  netWorthDelta?: SummaryDelta | null
  openCardDebt?: number
  discountInvoices?: boolean
  onToggleDiscountInvoices?: () => void
}

function Flow({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-caption text-fg-muted">{label}</span>
      <Amount value={value} className={`text-[0.9375rem] font-semibold ${tone ?? 'text-fg'}`} />
    </div>
  )
}

/**
 * Topo do Início no celular: o patrimônio é o número principal e o mês vira uma linha
 * só (entrou, saiu, resultado). No tablet/desktop quem mostra isso é o `MonthSummary`.
 */
export function MobileSummary({
  status,
  onRetry,
  monthName,
  income,
  expenses,
  netWorth,
  netWorthDelta,
  openCardDebt = 0,
  discountInvoices = false,
  onToggleDiscountInvoices,
}: MobileSummaryProps) {
  if (status === 'loading') {
    return (
      <div
        className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-1 p-4"
        aria-busy="true"
        aria-label="Carregando resumo"
      >
        <SkeletonBlock className="h-3 w-28" />
        <SkeletonBlock className="h-9 w-48" />
        <SkeletonBlock className="h-10" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface-1 p-4 text-body-sm text-expense"
      >
        Erro ao carregar resumo.
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-touch px-1 font-semibold text-brand-text underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
          >
            Tentar novamente
          </button>
        )}
      </div>
    )
  }

  // A variação continua sem desconto: o quanto faltava das faturas no mês passado não é guardado.
  const discounting = discountInvoices && openCardDebt > 0
  const shownNetWorth = discounting ? netWorth - openCardDebt : netWorth
  const delta = netWorthDelta
  const deltaTone =
    delta?.kind === 'up' ? 'text-income' : delta?.kind === 'down' ? 'text-expense' : 'text-fg-muted'

  return (
    <section
      aria-label={`Resumo de ${monthName}`}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-1 p-4"
    >
      <div className="flex flex-col gap-1.5">
        <span className="text-body-sm text-fg-muted">Patrimônio líquido</span>
        <Amount
          value={shownNetWorth}
          className="font-display text-[2.125rem] font-extrabold leading-none tracking-[-.02em]"
        />
        {delta && (
          <span className={`flex items-center gap-1 text-caption font-medium ${deltaTone}`}>
            {delta.kind === 'up' && <TrendingUp size={12} aria-hidden="true" />}
            {delta.kind === 'down' && <TrendingDown size={12} aria-hidden="true" />}
            {delta.text}
          </span>
        )}
        {discounting && (
          <span className="text-caption text-fg-muted">
            já descontando <Amount value={openCardDebt} /> de faturas
          </span>
        )}
        {onToggleDiscountInvoices && openCardDebt > 0 && (
          <button
            type="button"
            role="switch"
            aria-checked={discountInvoices}
            onClick={onToggleDiscountInvoices}
            className="flex min-h-touch items-center gap-2 self-start text-caption font-medium text-fg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
          >
            <span
              className={`toggle inline-block${discountInvoices ? ' on' : ''}`}
              aria-hidden="true"
            />
            Descontar faturas em aberto
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
        <Flow label="Entrou" value={income} tone="text-income" />
        <Flow label="Saiu" value={expenses} tone="text-expense" />
        <Flow label="Resultado" value={income - expenses} />
      </div>
    </section>
  )
}
