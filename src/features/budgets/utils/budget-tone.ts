/** Faixa da barra: verde até 80%, amarela até 100%, vermelha acima. */
export type BudgetTone = 'ok' | 'warn' | 'over'

export function budgetTone(percent: number): BudgetTone {
  if (percent > 100) return 'over'
  return percent >= 80 ? 'warn' : 'ok'
}

export const TONE_BAR: Record<BudgetTone, string> = {
  ok: 'bg-income',
  warn: 'bg-pending',
  over: 'bg-expense',
}

export const TONE_TEXT: Record<BudgetTone, string> = {
  ok: 'text-fg-muted',
  warn: 'text-pending',
  over: 'text-expense',
}

/**
 * Onde o gasto "deveria" estar hoje se fosse distribuído por igual no mês, em %.
 * Só faz sentido no mês corrente: num mês passado seria 100% e num futuro, 0.
 */
export function pacePercent(dayOfMonth: number, daysInMonth: number): number | null {
  if (dayOfMonth <= 0 || dayOfMonth >= daysInMonth) return null
  return (dayOfMonth / daysInMonth) * 100
}
