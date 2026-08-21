import { axiosInstance } from '@/services/http'
import type { Invoice, InvoiceSummary } from '@/features/cards/types'
import type {
  MerchantScope,
  PaginatedResponse,
  UpdateInvoiceItemRequest,
  UpdateInvoiceItemResponse,
} from '@/features/invoices/types'

export async function listInvoices(
  cardId: string,
  page = 0,
  size = 20,
): Promise<PaginatedResponse<InvoiceSummary>> {
  const response = await axiosInstance.get<PaginatedResponse<InvoiceSummary>>(
    `/cards/${cardId}/invoices`,
    { params: { page, size } },
  )
  return response.data
}

export async function getInvoiceById(invoiceId: string, size = 100): Promise<Invoice> {
  const response = await axiosInstance.get<Invoice>(`/cards/invoices/${invoiceId}`, {
    params: { page: 0, size },
  })
  return response.data
}

export async function updateInvoiceItem(
  itemId: string,
  data: UpdateInvoiceItemRequest,
): Promise<UpdateInvoiceItemResponse> {
  const response = await axiosInstance.patch<UpdateInvoiceItemResponse>(
    `/cards/invoices/items/${itemId}`,
    data,
  )
  return response.data
}

export async function getMerchantScope(itemId: string): Promise<MerchantScope> {
  const response = await axiosInstance.get<MerchantScope>(
    `/cards/invoices/items/${itemId}/merchant`,
  )
  return response.data
}

export async function settleInvoice(invoiceId: string): Promise<Invoice> {
  const response = await axiosInstance.post<Invoice>(`/cards/invoices/${invoiceId}/settle`)
  return response.data
}

export async function reopenInvoice(invoiceId: string): Promise<Invoice> {
  const response = await axiosInstance.post<Invoice>(`/cards/invoices/${invoiceId}/reopen`)
  return response.data
}
