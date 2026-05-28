import { axiosInstance } from '@/services/http'
import type {
  Recurrence,
  CreateRecurrenceRequest,
  UpdateRecurrenceRequest,
  PauseRecurrenceRequest,
  DeleteRecurrenceStrategy,
} from '@/features/recurrences/types'

export async function listRecurrences(): Promise<Recurrence[]> {
  const response = await axiosInstance.get<Recurrence[]>('/recurrences')
  return response.data
}

export async function getRecurrence(id: string): Promise<Recurrence> {
  const response = await axiosInstance.get<Recurrence>(`/recurrences/${id}`)
  return response.data
}

export async function createRecurrence(data: CreateRecurrenceRequest): Promise<Recurrence> {
  const response = await axiosInstance.post<Recurrence>('/recurrences', data)
  return response.data
}

export async function updateRecurrence(
  id: string,
  data: UpdateRecurrenceRequest,
): Promise<Recurrence> {
  const response = await axiosInstance.put<Recurrence>(`/recurrences/${id}`, data)
  return response.data
}

export async function pauseRecurrence(id: string, body?: PauseRecurrenceRequest): Promise<void> {
  await axiosInstance.post(`/recurrences/${id}/pause`, body ?? {})
}

export async function resumeRecurrence(id: string): Promise<void> {
  await axiosInstance.post(`/recurrences/${id}/resume`)
}

export async function deleteRecurrence(
  id: string,
  strategy: DeleteRecurrenceStrategy,
): Promise<void> {
  await axiosInstance.delete(`/recurrences/${id}`, { params: { strategy } })
}
