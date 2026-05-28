import { axiosInstance } from '@/services/http'
import type {
  DashboardOverview,
  CategoriesChart,
  CategoriesChartParams,
  MonthlyChart,
  NetWorthChart,
  NetWorthChartParams,
  MonthComparison,
  ComparisonChartParams,
  UpcomingBillItem,
  UpcomingInvoiceItem,
  LargestExpenseItem,
  RecentTransactionItem,
} from '@/features/dashboard/types'

export async function getOverview(): Promise<DashboardOverview> {
  const response = await axiosInstance.get<DashboardOverview>('/dashboard/overview')
  return response.data
}

export async function getCategoriesChart(params: CategoriesChartParams): Promise<CategoriesChart> {
  const response = await axiosInstance.get<CategoriesChart>('/dashboard/charts/categories', {
    params,
  })
  return response.data
}

export async function getMonthlyChart(months?: number): Promise<MonthlyChart> {
  const response = await axiosInstance.get<MonthlyChart>('/dashboard/charts/monthly', {
    params: months !== undefined ? { months } : undefined,
  })
  return response.data
}

export async function getNetWorthChart(params: NetWorthChartParams): Promise<NetWorthChart> {
  const response = await axiosInstance.get<NetWorthChart>('/dashboard/charts/net-worth', {
    params,
  })
  return response.data
}

export async function getComparisonChart(params: ComparisonChartParams): Promise<MonthComparison> {
  const response = await axiosInstance.get<MonthComparison>('/dashboard/charts/comparison', {
    params,
  })
  return response.data
}

export async function getUpcomingBills(daysAhead?: number): Promise<UpcomingBillItem[]> {
  const response = await axiosInstance.get<UpcomingBillItem[]>(
    '/dashboard/widgets/upcoming-bills',
    { params: daysAhead !== undefined ? { daysAhead } : undefined },
  )
  return response.data
}

export async function getUpcomingInvoices(): Promise<UpcomingInvoiceItem[]> {
  const response = await axiosInstance.get<UpcomingInvoiceItem[]>(
    '/dashboard/widgets/upcoming-invoices',
  )
  return response.data
}

export async function getLargestExpenses(limit?: number): Promise<LargestExpenseItem[]> {
  const response = await axiosInstance.get<LargestExpenseItem[]>(
    '/dashboard/widgets/largest-expenses',
    { params: limit !== undefined ? { limit } : undefined },
  )
  return response.data
}

export async function getRecentTransactions(limit?: number): Promise<RecentTransactionItem[]> {
  const response = await axiosInstance.get<RecentTransactionItem[]>(
    '/dashboard/widgets/recent-transactions',
    { params: limit !== undefined ? { limit } : undefined },
  )
  return response.data
}
