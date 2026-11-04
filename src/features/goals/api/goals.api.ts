import { axiosInstance } from '@/services/http'
import type { SaveGoalRequest, SavingsGoal } from '@/features/goals/types'

/** Ativas e arquivadas: a página separa as duas, o dashboard só usa as ativas. */
export async function listGoals(): Promise<SavingsGoal[]> {
  const response = await axiosInstance.get<SavingsGoal[]>('/goals', {
    params: { includeArchived: true },
  })
  return response.data
}

export async function createGoal(data: SaveGoalRequest): Promise<SavingsGoal> {
  const response = await axiosInstance.post<SavingsGoal>('/goals', data)
  return response.data
}

export async function updateGoal(id: string, data: SaveGoalRequest): Promise<SavingsGoal> {
  const response = await axiosInstance.put<SavingsGoal>(`/goals/${id}`, data)
  return response.data
}

/** Meta com progresso é arquivada; sem progresso (ou já arquivada) é apagada. */
export async function deleteGoal(id: string): Promise<void> {
  await axiosInstance.delete(`/goals/${id}`)
}

export async function unarchiveGoal(id: string): Promise<SavingsGoal> {
  const response = await axiosInstance.post<SavingsGoal>(`/goals/${id}/unarchive`)
  return response.data
}
