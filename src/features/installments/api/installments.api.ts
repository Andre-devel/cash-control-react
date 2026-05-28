import { axiosInstance } from '@/services/http'
import type {
  InstallmentSeries,
  InstallmentSeriesDetail,
  CreateInstallmentSeriesRequest,
  EditSeriesRequest,
  UpdateInstallmentRequest,
  AdvanceInstallmentsRequest,
} from '@/features/installments/types'

export async function listInstallments(): Promise<InstallmentSeries[]> {
  const response = await axiosInstance.get<InstallmentSeries[]>('/installments')
  return response.data
}

export async function listInstallmentSeries(): Promise<InstallmentSeries[]> {
  const response = await axiosInstance.get<InstallmentSeries[]>('/installments/series')
  return response.data
}

export async function getInstallmentSeriesDetail(
  seriesId: string,
): Promise<InstallmentSeriesDetail> {
  const response = await axiosInstance.get<InstallmentSeriesDetail>(
    `/installments/series/${seriesId}`,
  )
  return response.data
}

export async function createInstallmentSeries(
  data: CreateInstallmentSeriesRequest,
): Promise<InstallmentSeries> {
  const response = await axiosInstance.post<InstallmentSeries>('/installments', data)
  return response.data
}

export async function updateSeries(
  seriesId: string,
  data: EditSeriesRequest,
): Promise<InstallmentSeries> {
  const response = await axiosInstance.put<InstallmentSeries>(
    `/installments/series/${seriesId}`,
    data,
  )
  return response.data
}

export async function updateInstallment(
  transactionId: string,
  data: UpdateInstallmentRequest,
): Promise<void> {
  await axiosInstance.put(`/installments/${transactionId}`, data)
}

export async function settleSeries(seriesId: string): Promise<void> {
  await axiosInstance.post(`/installments/series/${seriesId}/settle`)
}

export async function advanceInstallments(data: AdvanceInstallmentsRequest): Promise<void> {
  await axiosInstance.post('/installments/advance', data)
}
