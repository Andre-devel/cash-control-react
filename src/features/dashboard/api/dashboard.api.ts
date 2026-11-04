import { axiosInstance } from '@/services/http'
import { scopeParams, type ScopeFilter } from '@/app/store/scope.store'
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
  BalanceProjection,
  Subscriptions,
} from '@/features/dashboard/types'

export async function getOverview(scope: ScopeFilter = 'ALL'): Promise<DashboardOverview> {
  const response = await axiosInstance.get<DashboardOverview>('/dashboard/overview', {
    params: scopeParams(scope),
  })
  return response.data
}

export async function getCategoriesChart(
  params: CategoriesChartParams,
  scope: ScopeFilter = 'ALL',
): Promise<CategoriesChart> {
  const response = await axiosInstance.get<CategoriesChart>('/dashboard/charts/categories', {
    params: { ...params, ...scopeParams(scope) },
  })
  return response.data
}

export async function getMonthlyChart(
  months?: number,
  scope: ScopeFilter = 'ALL',
): Promise<MonthlyChart> {
  const response = await axiosInstance.get<MonthlyChart>('/dashboard/charts/monthly', {
    params: { months, ...scopeParams(scope) },
  })
  return response.data
}

export async function getNetWorthChart(
  params: NetWorthChartParams,
  scope: ScopeFilter = 'ALL',
): Promise<NetWorthChart> {
  const response = await axiosInstance.get<NetWorthChart>('/dashboard/charts/net-worth', {
    params: { ...params, ...scopeParams(scope) },
  })
  return response.data
}

export async function getComparisonChart(
  params: ComparisonChartParams,
  scope: ScopeFilter = 'ALL',
): Promise<MonthComparison> {
  const response = await axiosInstance.get<MonthComparison>('/dashboard/charts/comparison', {
    params: { ...params, ...scopeParams(scope) },
  })
  return response.data
}

export async function getUpcomingBills(
  daysAhead?: number,
  scope: ScopeFilter = 'ALL',
): Promise<UpcomingBillItem[]> {
  const response = await axiosInstance.get<UpcomingBillItem[]>(
    '/dashboard/widgets/upcoming-bills',
    { params: { daysAhead, ...scopeParams(scope) } },
  )
  return response.data
}

export async function getUpcomingInvoices(
  daysAhead?: number,
  scope: ScopeFilter = 'ALL',
): Promise<UpcomingInvoiceItem[]> {
  const response = await axiosInstance.get<UpcomingInvoiceItem[]>(
    '/dashboard/widgets/upcoming-invoices',
    { params: { daysAhead, ...scopeParams(scope) } },
  )
  return response.data
}

/** Sem `range`, a API usa o mês atual. */
export async function getLargestExpenses(
  limit?: number,
  range?: { from: string; to: string },
  scope: ScopeFilter = 'ALL',
): Promise<LargestExpenseItem[]> {
  const response = await axiosInstance.get<LargestExpenseItem[]>(
    '/dashboard/widgets/largest-expenses',
    { params: { limit, from: range?.from, to: range?.to, ...scopeParams(scope) } },
  )
  return response.data
}

export async function getRecentTransactions(
  limit?: number,
  scope: ScopeFilter = 'ALL',
): Promise<RecentTransactionItem[]> {
  const response = await axiosInstance.get<RecentTransactionItem[]>(
    '/dashboard/widgets/recent-transactions',
    { params: { limit, ...scopeParams(scope) } },
  )
  return response.data
}

export async function getBalanceProjection(
  days: number,
  scope: ScopeFilter = 'ALL',
): Promise<BalanceProjection> {
  const response = await axiosInstance.get<BalanceProjection>('/dashboard/projection', {
    params: { days, ...scopeParams(scope) },
  })
  return response.data
}

export async function getSubscriptions(scope: ScopeFilter = 'ALL'): Promise<Subscriptions> {
  const response = await axiosInstance.get<Subscriptions>('/dashboard/subscriptions', {
    params: scopeParams(scope),
  })
  return response.data
}
