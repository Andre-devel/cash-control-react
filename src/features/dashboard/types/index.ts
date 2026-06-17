export interface DashboardOverview {
  totalBalance: string
  monthlyIncome: string
  monthlyExpenses: string
  netWorth?: string
  monthlySavings?: string
  cashFlow?: string
  currentMonth?: string
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
  savings?: string
  balance?: string
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
  invoiceId?: string
  cardName: string
  referenceMonth?: string
  totalAmount: string
  dueDate: string
  status?: string
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
  type: string
  amount: string
  accountName: string | null
  categoryName?: string | null
  competenceDate: string
  status: string
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
