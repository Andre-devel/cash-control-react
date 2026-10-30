import { ArrowDownLeft, ArrowUpRight, Landmark, TrendingDown, TrendingUp } from 'lucide-react'
import { Amount } from './amount'
import { SkeletonBlock } from './panel'

export type DeltaKind = 'up' | 'down' | 'neutral'

export interface SummaryDelta {
  text: string
  /** Cor: `up` é bom (verde), `down` é ruim (vermelho). */
  kind: DeltaKind
  /** Seta, quando a direção não coincide com a cor (despesa que caiu é boa). */
  trend?: 'up' | 'down'
}

export interface MiniBar {
  key: string
  label: string
  income: number
  expense: number
}

interface MonthSummaryProps {
  status: 'loading' | 'error' | 'ready'
  onRetry?: () => void
  /** `outubro`. */
  monthName: string
  balance: number
  income: number
  expenses: number
  incomeDelta?: SummaryDelta | null
  expensesDelta?: SummaryDelta | null
  /** Patrimônio com as aplicações pelo líquido de IR/IOF, sem descontar faturas. */
  netWorth: number
  netWorthDelta?: SummaryDelta | null
  /** Falta pagar das faturas; com a chave ligada, sai do patrimônio exibido. */
  openCardDebt?: number
  discountInvoices?: boolean
  onToggleDiscountInvoices?: () => void
  miniBars: MiniBar[]
  selectedKey: string
  className?: string
}

/** Fundo do destaque: brilho menta no canto sobre a superfície 1. */
const HERO_BG =
  'bg-surface-1 bg-[radial-gradient(120%_90%_at_100%_0%,rgb(var(--cc-brand)/.14),rgb(var(--cc-brand)/0)_60%)]'
const HERO_BG_MD =
  'md:bg-surface-1 md:bg-[radial-gradient(120%_120%_at_100%_0%,rgb(var(--cc-brand)/.14),rgb(var(--cc-brand)/0)_60%)]'

/** Card no tablet/desktop; no celular as partes ficam dentro do destaque. */
const KPI_MD = 'md:rounded-2xl md:border md:border-border md:p-4 xl:p-5'

const KPI_VALUE =
  'text-[1.0625rem] font-semibold md:font-display md:text-amount-lg md:font-bold xl:text-[1.75rem] xl:font-extrabold xl:tracking-[-.015em]'

function Delta({ delta }: { delta?: SummaryDelta | null }) {
  if (!delta) return null
  const arrow = delta.trend ?? (delta.kind === 'neutral' ? undefined : delta.kind)
  const tone =
    delta.kind === 'up' ? 'text-income' : delta.kind === 'down' ? 'text-expense' : 'text-fg-muted'
  return (
    <span
      className={`summary-delta is-${delta.kind} flex items-center gap-1 text-caption font-medium ${tone}`}
    >
      {arrow === 'up' && <TrendingUp size={12} aria-hidden="true" />}
      {arrow === 'down' && <TrendingDown size={12} aria-hidden="true" />}
      {delta.text}
    </span>
  )
}

function SummarySkeleton({ className }: { className: string }) {
  return (
    <div
      className={`flex flex-col gap-2 md:[display:grid] md:grid-cols-4 md:gap-3 xl:gap-4 ${className}`}
      aria-busy="true"
      aria-label="Carregando resumo"
    >
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`flex-col gap-3 rounded-2xl border border-border bg-surface-1 p-5 ${i === 1 ? 'flex' : 'hidden md:flex'}`}
        >
          <SkeletonBlock className="h-3 w-28" />
          <SkeletonBlock className={i === 1 ? 'h-10 w-48 md:h-7 md:w-32' : 'h-7 w-32'} />
          <SkeletonBlock className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}

export function MonthSummary({
  status,
  onRetry,
  monthName,
  balance,
  income,
  expenses,
  incomeDelta,
  expensesDelta,
  netWorth,
  netWorthDelta,
  openCardDebt = 0,
  discountInvoices = false,
  onToggleDiscountInvoices,
  miniBars,
  selectedKey,
  className = '',
}: MonthSummaryProps) {
  if (status === 'loading') return <SummarySkeleton className={className} />

  if (status === 'error') {
    return (
      <div
        role="alert"
        className={`flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface-1 p-4 text-body-sm text-expense ${className}`}
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

  const barMax = Math.max(1, ...miniBars.flatMap((b) => [b.income, b.expense]))
  // A variação continua sem desconto: o quanto faltava das faturas no mês passado não é guardado.
  const discounting = discountInvoices && openCardDebt > 0
  const shownNetWorth = discounting ? netWorth - openCardDebt : netWorth

  return (
    <section
      aria-label={`Resumo de ${monthName}`}
      className={`flex flex-col gap-2 md:[display:grid] md:grid-cols-4 md:gap-3 xl:gap-4 ${className}`}
    >
      {/* Destaque do celular; no tablet/desktop vira três cards da linha de KPIs. */}
      <div
        className={`flex flex-col gap-5 rounded-3xl border border-border p-5 md:contents ${HERO_BG}`}
      >
        <div className={`flex min-w-0 flex-col gap-4 md:gap-2.5 ${KPI_MD} ${HERO_BG_MD}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-body-sm text-fg-muted">Saldo de {monthName}</span>
          </div>
          <Amount
            value={balance}
            signed
            className="font-display text-display md:text-amount-lg md:font-bold xl:text-[1.75rem] xl:font-extrabold"
          />
          <span className="text-caption text-fg-muted">Receitas − Despesas</span>
          {miniBars.length > 0 && (
            <div className="flex h-[72px] items-end gap-2.5 md:hidden" aria-hidden="true">
              {miniBars.map((b) => (
                <div
                  key={b.key}
                  className={`flex flex-1 flex-col items-center gap-1.5 ${
                    b.key === selectedKey ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  <div className="flex h-[54px] items-end gap-[3px]">
                    <span
                      className="w-[9px] rounded-[4px] bg-income"
                      style={{ height: `${Math.max(2, (b.income / barMax) * 54)}px` }}
                    />
                    <span
                      className="w-[9px] rounded-[4px] bg-expense"
                      style={{ height: `${Math.max(2, (b.expense / barMax) * 54)}px` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium leading-none text-fg-muted">
                    {b.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="[display:grid] grid-cols-2 border-t border-border pt-4 md:contents">
          <div className={`flex min-w-0 flex-col gap-1.5 md:gap-2.5 md:bg-surface-1 ${KPI_MD}`}>
            <span className="flex items-center gap-1.5 text-caption text-fg-muted md:text-body-sm md:font-medium">
              <ArrowDownLeft size={14} className="text-income" aria-hidden="true" />
              Receitas
            </span>
            <Amount value={income} className={KPI_VALUE} />
            <Delta delta={incomeDelta} />
          </div>
          <div
            className={`flex min-w-0 flex-col gap-1.5 border-l border-border pl-4 md:gap-2.5 md:bg-surface-1 ${KPI_MD}`}
          >
            <span className="flex items-center gap-1.5 text-caption text-fg-muted md:text-body-sm md:font-medium">
              <ArrowUpRight size={14} className="text-expense" aria-hidden="true" />
              Despesas
            </span>
            <Amount value={expenses} className={KPI_VALUE} />
            <Delta delta={expensesDelta} />
          </div>
        </div>
      </div>

      <div
        className={`flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-surface-1 px-4 py-3 md:flex-col md:items-stretch md:gap-2.5 md:p-4 xl:p-5`}
      >
        <span
          className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-info-soft text-info md:hidden"
          aria-hidden="true"
        >
          <Landmark size={17} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1 md:gap-2.5">
          <span className="flex items-center gap-1.5 text-caption text-fg-muted md:text-body-sm md:font-medium">
            <Landmark size={14} className="hidden text-info md:inline" aria-hidden="true" />
            Patrimônio líquido
          </span>
          <Amount value={shownNetWorth} className={KPI_VALUE} />
          <Delta delta={netWorthDelta} />
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
      </div>
    </section>
  )
}
