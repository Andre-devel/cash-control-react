import { axiosInstance } from '@/services/http'
import type {
  Card,
  Invoice,
  LimitUsage,
  SpendingItem,
  CreateCardRequest,
  UpdateCardRequest,
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

/**
 * O backend valida `last4Digits` com `@Pattern("\\d{4}")`, que rejeita string vazia —
 * e vazio é o que o formulário devolve quando o campo não foi preenchido. Omitir o
 * campo é o que significa "não informado".
 */
function withoutBlankLast4<T extends CreateCardRequest>(data: T): T {
  return data.last4Digits ? data : { ...data, last4Digits: undefined }
}

export async function createCard(data: CreateCardRequest): Promise<Card> {
  const response = await axiosInstance.post<Card>('/cards', withoutBlankLast4(data))
  return response.data
}

export async function updateCard(id: string, data: UpdateCardRequest): Promise<Card> {
  const response = await axiosInstance.put<Card>(`/cards/${id}`, withoutBlankLast4(data))
  return response.data
}

export async function archiveCard(id: string): Promise<void> {
  await axiosInstance.post(`/cards/${id}/archive`)
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
