import type { TransactionStatus, TransactionType } from '@/features/transactions/types'

export interface DashboardOverview {
  totalBalance: string
  monthlyIncome: string
  monthlyExpenses: string
  netWorth?: string
  monthlySavings?: string
  cashFlow?: string
  currentMonth?: string
  /** Patrimônio no último dia do mês anterior. */
  previousNetWorth?: string
  previousMonthIncome?: string
  previousMonthExpenses?: string
  /** Aplicações de renda fixa ativas, hoje: bruto e líquido de IR/IOF. */
  investmentsGross?: string
  investmentsNet?: string
  /** Quanto o bruto das aplicações ativas rendeu desde o fim do mês anterior. */
  investmentsYieldMonth?: string
  /** Falta pagar de todas as faturas não pagas, futuras inclusive. */
  openCardDebt?: string
}

export interface CategoryChartItem {
  categoryId: string | null
  categoryName: string | null
  totalAmount: string
  percentage: string
}

export interface CategoriesChart {
  entries: CategoryChartItem[]
  totalAmount?: string
}

export interface MonthlyChartEntry {
  month: string
  income: string
  expenses: string
  net?: string
}

export interface MonthlyChart {
  months: MonthlyChartEntry[]
}

export interface NetWorthPoint {
  date: string
  netWorth: string
}

export interface NetWorthChart {
  snapshots: NetWorthPoint[]
}

export interface ComparisonMonth {
  month: string
  income: string
  expenses: string
  savings: string
}

export interface MonthComparison {
  month1: ComparisonMonth
  month2: ComparisonMonth
}

export interface UpcomingBillItem {
  id: string
  description: string
  amount: string
  paymentDate: string
  accountName: string | null
  categoryName?: string | null
  status: 'PENDING' | 'OVERDUE' | 'PAID' | 'CANCELLED'
}

export interface UpcomingInvoiceItem {
  invoiceId: string
  cardName: string
  totalAmount: string
  paidAmount: string
  remainingAmount: string
  dueDate: string
  status: 'CLOSED' | 'PARTIAL' | 'OVERDUE'
}

export interface LargestExpenseItem {
  id: string
  description: string
  categoryName: string | null
  accountName?: string | null
  amount: string
  paymentDate: string
}

export interface RecentTransactionItem {
  id: string
  description: string
  type: TransactionType
  amount: string
  accountName: string | null
  categoryName?: string | null
  competenceDate: string
  status: TransactionStatus
}

export interface BalanceProjectionPoint {
  date: string
  balance: string
}

export type BalanceProjectionEventKind = 'TRANSACTION' | 'INVOICE' | 'RECURRENCE'

export interface BalanceProjectionEvent {
  /** Data prevista; o que está vencido aparece em hoje. */
  date: string
  kind: BalanceProjectionEventKind
  description: string
  /** Com sinal: positivo entra, negativo sai. */
  amount: string
  /** Ocorrência de recorrência que ainda não foi gerada. */
  estimated: boolean
}

export interface BalanceProjection {
  from: string
  to: string
  startBalance: string
  endBalance: string
  lowest: BalanceProjectionPoint
  firstNegativeDate: string | null
  points: BalanceProjectionPoint[]
  events: BalanceProjectionEvent[]
}

export interface CategoriesChartParams {
  from: string
  to: string
  accountId?: string
  type?: string
}

export interface NetWorthChartParams {
  from: string
  to: string
  granularity?: 'DAILY' | 'WEEKLY' | 'MONTHLY'
}

export interface ComparisonChartParams {
  month1: string
  month2: string
}
