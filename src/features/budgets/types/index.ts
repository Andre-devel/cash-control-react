export type BudgetSource = 'DEFAULT' | 'MONTH'

export interface BudgetItem {
  categoryId: string
  name: string
  color: string | null
  icon: string | null
  parentId: string | null
  budget: number
  spent: number
  /** Contas a vencer no mês, fora do cartão: ainda não são gasto. */
  forecast: number
  remaining: number
  percent: number
  /** DEFAULT vale todo mês; MONTH é o ajuste só deste mês. */
  source: BudgetSource
}

export interface BudgetProgress {
  /** `aaaa-mm` */
  month: string
  totalBudget: number
  totalSpent: number
  totalForecast: number
  uncategorizedSpent: number
  /** Dias já passados do mês: 0 num mês futuro, todos num mês passado. */
  dayOfMonth: number
  daysInMonth: number
  /** Só categorias com teto, maior percentual primeiro. */
  items: BudgetItem[]
}

export interface SaveBudgetRequest {
  amount: string
  /** `aaaa-mm` para ajustar só aquele mês; `null` grava o teto padrão. */
  month: string | null
}

export interface BudgetHistoryCell {
  /** `aaaa-mm` */
  month: string
  /** Teto vigente naquele mês; `null` quando a categoria ainda não tinha teto. */
  budget: number | null
  spent: number
  /** `null` sem teto. */
  percent: number | null
}

export interface BudgetHistoryItem {
  categoryId: string
  name: string
  icon: string | null
  color: string | null
  /** Uma célula por mês, na ordem de `months`. */
  cells: BudgetHistoryCell[]
}

export interface BudgetHistoryData {
  /** `aaaa-mm`, do mais antigo ao atual. */
  months: string[]
  items: BudgetHistoryItem[]
}
