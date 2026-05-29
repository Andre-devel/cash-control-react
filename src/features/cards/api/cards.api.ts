import { axiosInstance } from '@/services/http'
import type {
  Card,
  Invoice,
  LimitUsage,
  SpendingItem,
  CreateCardRequest,
  UpdateCardRequest,
  RecordChargeRequest,
  PayInvoiceRequest,
  SpendingBreakdownParams,
} from '@/features/cards/types'

export async function listCards(): Promise<Card[]> {
  const response = await axiosInstance.get<Card[]>('/cards')
  return response.data
}

export async function getCard(id: string): Promise<Card> {
  const response = await axiosInstance.get<Card>(`/cards/${id}`)
  return response.data
}

export async function createCard(data: CreateCardRequest): Promise<Card> {
  const response = await axiosInstance.post<Card>('/cards', data)
  return response.data
}

export async function updateCard(id: string, data: UpdateCardRequest): Promise<Card> {
  const response = await axiosInstance.put<Card>(`/cards/${id}`, data)
  return response.data
}

export async function archiveCard(id: string): Promise<void> {
  await axiosInstance.post(`/cards/${id}/archive`)
}

export async function recordCharge(id: string, data: RecordChargeRequest): Promise<void> {
  await axiosInstance.post(`/cards/${id}/charges`, data)
}

export async function getInvoice(id: string, referenceMonth: string): Promise<Invoice> {
  const response = await axiosInstance.get<Invoice>(`/cards/${id}/invoices/${referenceMonth}`)
  return response.data
}

export async function payInvoice(invoiceId: string, data: PayInvoiceRequest): Promise<void> {
  await axiosInstance.post(`/cards/invoices/${invoiceId}/pay`, data)
}

export async function getLimitUsage(id: string): Promise<LimitUsage> {
  const response = await axiosInstance.get<LimitUsage>(`/cards/${id}/limit`)
  return response.data
}

export async function getSpendingBreakdown(
  id: string,
  params: SpendingBreakdownParams,
): Promise<SpendingItem[]> {
  const response = await axiosInstance.get<SpendingItem[]>(`/cards/${id}/spending`, { params })
  return response.data
}

export async function deleteCard(id: string): Promise<void> {
  await axiosInstance.delete(`/cards/${id}`)
}
