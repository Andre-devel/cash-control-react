export interface DashboardOverview {
  totalBalance: string
  monthlyIncome: string
  monthlyExpenses: string
  netWorth?: string
  monthlySavings?: string
  cashFlow?: string
  activeAccountsCount: number
}

export interface CategoryChartItem {
  categoryId: string | null
  categoryName: string | null
  amount: string
  percentage: string
}

export interface CategoriesChart {
  items: CategoryChartItem[]
}

export interface MonthlyChartEntry {
  month: string
  income: string
  expenses: string
}

export interface MonthlyChart {
  data: MonthlyChartEntry[]
}

export interface NetWorthPoint {
  date: string
  netWorth: string
}

export interface NetWorthChart {
  data: NetWorthPoint[]
}

export interface ComparisonMonth {
  month: string
  income: string
  expenses: string
  balance: string
}

export interface MonthComparison {
  month1: ComparisonMonth
  month2: ComparisonMonth
}

export interface UpcomingBillItem {
  id: string
  description: string
  amount: string
  dueDate: string
  accountId: string
  accountName: string | null
  status: 'PENDING' | 'OVERDUE'
}

export interface UpcomingInvoiceItem {
  cardId: string
  cardName: string
  referenceMonth: string
  totalAmount: string
  dueDate: string
}

export interface LargestExpenseItem {
  id: string
  description: string
  categoryId: string | null
  categoryName: string | null
  amount: string
  date: string
}

export interface RecentTransactionItem {
  id: string
  description: string
  type: string
  amount: string
  accountId: string
  accountName: string | null
  date: string
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
