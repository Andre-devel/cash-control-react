import { axiosInstance } from '@/services/http'
import type {
  Recurrence,
  RecurrenceCreationResponse,
  CreateRecurrenceRequest,
  UpdateRecurrenceRequest,
  PauseRecurrenceRequest,
  DeleteRecurrenceStrategy,
  EditRecurrenceResult,
} from '@/features/recurrences/types'

export async function listRecurrences(): Promise<Recurrence[]> {
  const response = await axiosInstance.get<Recurrence[]>('/recurrences')
  return response.data
}

export async function getRecurrence(id: string): Promise<Recurrence> {
  const response = await axiosInstance.get<Recurrence>(`/recurrences/${id}`)
  return response.data
}

export async function createRecurrence(
  data: CreateRecurrenceRequest,
): Promise<RecurrenceCreationResponse> {
  const response = await axiosInstance.post<RecurrenceCreationResponse>('/recurrences', data)
  return response.data
}

export async function updateRecurrence(
  id: string,
  data: UpdateRecurrenceRequest,
): Promise<EditRecurrenceResult> {
  const response = await axiosInstance.put<EditRecurrenceResult>(`/recurrences/${id}`, data)
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
