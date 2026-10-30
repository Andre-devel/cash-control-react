import { http, HttpResponse } from 'msw'
import type {
  DashboardOverview,
  CategoriesChart,
  MonthlyChart,
  NetWorthChart,
  MonthComparison,
  UpcomingBillItem,
  UpcomingInvoiceItem,
  LargestExpenseItem,
  RecentTransactionItem,
  BalanceProjection,
} from '@/features/dashboard/types'

export const MOCK_OVERVIEW: DashboardOverview = {
  totalBalance: '12500.00',
  monthlyIncome: '5000.00',
  monthlyExpenses: '3200.00',
  cashFlow: '1800.00',
  netWorth: '15000.00',
  previousNetWorth: '14000.00',
  previousMonthIncome: '4000.00',
  previousMonthExpenses: '4000.00',
}

export const MOCK_CATEGORIES_CHART: CategoriesChart = {
  entries: [
    { categoryId: 'cat-1', categoryName: 'Food', totalAmount: '800.00', percentage: '25.00' },
    { categoryId: 'cat-2', categoryName: 'Transport', totalAmount: '400.00', percentage: '12.50' },
    { categoryId: null, categoryName: null, totalAmount: '2000.00', percentage: '62.50' },
  ],
}

export const MOCK_MONTHLY_CHART: MonthlyChart = {
  months: [
    { month: '2026-01', income: '4500.00', expenses: '3000.00' },
    { month: '2026-02', income: '4800.00', expenses: '3200.00' },
    { month: '2026-03', income: '5000.00', expenses: '2900.00' },
    { month: '2026-04', income: '4700.00', expenses: '3100.00' },
    { month: '2026-05', income: '5000.00', expenses: '3200.00' },
    { month: '2026-06', income: '5200.00', expenses: '3400.00' },
  ],
}

export const MOCK_NET_WORTH_CHART: NetWorthChart = {
  snapshots: [
    { date: '2026-01-01', netWorth: '10000.00' },
    { date: '2026-02-01', netWorth: '11300.00' },
    { date: '2026-03-01', netWorth: '12400.00' },
    { date: '2026-04-01', netWorth: '13000.00' },
    { date: '2026-05-01', netWorth: '12500.00' },
  ],
}

export const MOCK_COMPARISON: MonthComparison = {
  month1: {
    month: '2026-04',
    income: '4700.00',
    expenses: '3100.00',
    savings: '1600.00',
  },
  month2: {
    month: '2026-05',
    income: '5000.00',
    expenses: '3200.00',
    savings: '1800.00',
  },
}

export const MOCK_UPCOMING_BILLS: UpcomingBillItem[] = [
  {
    id: 'bill-1',
    description: 'Electricity',
    amount: '150.00',
    paymentDate: '2026-06-01',
    accountName: 'Checking',
    status: 'PENDING',
  },
  {
    id: 'bill-2',
    description: 'Internet',
    amount: '80.00',
    paymentDate: '2026-05-25',
    accountName: 'Checking',
    status: 'PENDING',
  },
]

export const MOCK_UPCOMING_INVOICES: UpcomingInvoiceItem[] = [
  {
    invoiceId: 'invoice-1',
    cardName: 'Nubank',
    totalAmount: '800.00',
    paidAmount: '0.00',
    remainingAmount: '800.00',
    dueDate: '2026-06-10',
    status: 'CLOSED',
  },
]

export const MOCK_LARGEST_EXPENSES: LargestExpenseItem[] = [
  {
    id: 'tx-1',
    description: 'Laptop',
    categoryName: 'Electronics',
    amount: '3500.00',
    paymentDate: '2026-05-01',
  },
  {
    id: 'tx-2',
    description: 'Rent',
    categoryName: 'Housing',
    amount: '2000.00',
    paymentDate: '2026-05-05',
  },
]

export const MOCK_RECENT_TRANSACTIONS: RecentTransactionItem[] = [
  {
    id: 'tx-1',
    description: 'Supermarket',
    type: 'EXPENSE',
    amount: '150.75',
    accountName: 'Checking',
    competenceDate: '2026-05-26',
    status: 'PAID',
  },
  {
    id: 'tx-2',
    description: 'Salary',
    type: 'INCOME',
    amount: '5000.00',
    accountName: 'Checking',
    competenceDate: '2026-05-25',
    status: 'PAID',
  },
]

export const MOCK_BALANCE_PROJECTION: BalanceProjection = {
  from: '2026-11-01',
  to: '2026-12-01',
  startBalance: '1000.00',
  endBalance: '2300.00',
  lowest: { date: '2026-11-01', balance: '800.00' },
  firstNegativeDate: null,
  points: [
    { date: '2026-11-01', balance: '800.00' },
    { date: '2026-11-05', balance: '3800.00' },
    { date: '2026-11-10', balance: '2300.00' },
    { date: '2026-12-01', balance: '2300.00' },
  ],
  events: [
    {
      date: '2026-11-01',
      kind: 'TRANSACTION',
      description: 'Conta de luz',
      amount: '-200.00',
      estimated: false,
    },
    {
      date: '2026-11-05',
      kind: 'TRANSACTION',
      description: 'Salário',
      amount: '3000.00',
      estimated: false,
    },
    {
      date: '2026-11-10',
      kind: 'RECURRENCE',
      description: 'Aluguel',
      amount: '-1500.00',
      estimated: true,
    },
  ],
}

export const dashboardHandlers = [
  http.get('*/dashboard/overview', () => {
    return HttpResponse.json(MOCK_OVERVIEW)
  }),

  http.get('*/dashboard/charts/categories', () => {
    return HttpResponse.json(MOCK_CATEGORIES_CHART)
  }),

  http.get('*/dashboard/charts/monthly', () => {
    return HttpResponse.json(MOCK_MONTHLY_CHART)
  }),

  http.get('*/dashboard/charts/net-worth', () => {
    return HttpResponse.json(MOCK_NET_WORTH_CHART)
  }),

  http.get('*/dashboard/charts/comparison', () => {
    return HttpResponse.json(MOCK_COMPARISON)
  }),

  http.get('*/dashboard/widgets/upcoming-bills', () => {
    return HttpResponse.json(MOCK_UPCOMING_BILLS)
  }),

  http.get('*/dashboard/widgets/upcoming-invoices', () => {
    return HttpResponse.json(MOCK_UPCOMING_INVOICES)
  }),

  http.get('*/dashboard/widgets/largest-expenses', () => {
    return HttpResponse.json(MOCK_LARGEST_EXPENSES)
  }),

  http.get('*/dashboard/widgets/recent-transactions', () => {
    return HttpResponse.json(MOCK_RECENT_TRANSACTIONS)
  }),

  http.get('*/dashboard/projection', () => {
    return HttpResponse.json(MOCK_BALANCE_PROJECTION)
  }),
]
