import { TONE_BAR, budgetTone } from '@/features/budgets/utils/budget-tone'

interface BudgetBarProps {
  budget: number
  spent: number
  forecast?: number
  /** Ritmo do mês em %, ou `null` fora do mês corrente. */
  pace?: number | null
  className?: string
}

const clamp = (value: number) => Math.min(Math.max(value, 0), 100)

/**
 * Barra de uso do teto. Decorativa: os números ficam no texto ao lado, para leitor de tela.
 * O previsto é um trecho mais claro depois do gasto; a marca vertical é o ritmo do mês.
 */
export function BudgetBar({
  budget,
  spent,
  forecast = 0,
  pace = null,
  className = '',
}: BudgetBarProps) {
  const spentPct = budget > 0 ? (spent / budget) * 100 : 0
  const tone = budgetTone(spentPct)
  const spentWidth = clamp(spentPct)
  const forecastWidth = clamp(spentPct + (budget > 0 ? (forecast / budget) * 100 : 0)) - spentWidth

  return (
    <div
      aria-hidden="true"
      data-tone={tone}
      className={`relative h-2 w-full overflow-hidden rounded-full bg-surface-3 ${className}`}
    >
      <div
        className={`absolute inset-y-0 left-0 rounded-full ${TONE_BAR[tone]}`}
        style={{ width: `${spentWidth}%` }}
      />
      {forecastWidth > 0 && (
        <div
          data-testid="budget-forecast"
          className={`absolute inset-y-0 opacity-35 ${TONE_BAR[tone]}`}
          style={{ left: `${spentWidth}%`, width: `${forecastWidth}%` }}
        />
      )}
      {pace !== null && (
        <div
          data-testid="budget-pace"
          className="absolute inset-y-0 w-0.5 bg-fg/70"
          style={{ left: `calc(${clamp(pace)}% - 1px)` }}
        />
      )}
    </div>
  )
}
