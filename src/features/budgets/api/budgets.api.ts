import { axiosInstance } from '@/services/http'
import type { BudgetHistoryData, BudgetProgress, SaveBudgetRequest } from '@/features/budgets/types'

export async function getBudgetProgress(month: string): Promise<BudgetProgress> {
  const response = await axiosInstance.get<BudgetProgress>('/budgets', { params: { month } })
  return response.data
}

/** Teto × gasto por categoria nos últimos `months` meses (1 a 12), até o mês atual. */
export async function getBudgetHistory(months: number): Promise<BudgetHistoryData> {
  const response = await axiosInstance.get<BudgetHistoryData>('/budgets/history', {
    params: { months },
  })
  return response.data
}

export async function saveBudget(categoryId: string, data: SaveBudgetRequest): Promise<void> {
  await axiosInstance.put(`/budgets/${categoryId}`, data)
}

/** Sem `month` remove o teto padrão; com ele, só o ajuste daquele mês. */
export async function deleteBudget(categoryId: string, month: string | null): Promise<void> {
  await axiosInstance.delete(`/budgets/${categoryId}`, { params: month ? { month } : undefined })
}
