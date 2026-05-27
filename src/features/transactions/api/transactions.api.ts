import { axiosInstance } from '@/services/http'
import type {
  Transaction,
  Attachment,
  PaginatedResponse,
  ListTransactionsParams,
  CreateTransactionRequest,
  UpdateTransactionRequest,
} from '@/features/transactions/types'

export async function listTransactions(
  params?: ListTransactionsParams,
): Promise<PaginatedResponse<Transaction>> {
  const response = await axiosInstance.get<PaginatedResponse<Transaction>>('/transactions', {
    params,
  })
  return response.data
}

export async function getTransaction(id: string): Promise<Transaction> {
  const response = await axiosInstance.get<Transaction>(`/transactions/${id}`)
  return response.data
}

export async function createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
  const response = await axiosInstance.post<Transaction>('/transactions', data)
  return response.data
}

export async function updateTransaction(
  id: string,
  data: UpdateTransactionRequest,
): Promise<Transaction> {
  const response = await axiosInstance.put<Transaction>(`/transactions/${id}`, data)
  return response.data
}

export async function deleteTransaction(id: string): Promise<void> {
  await axiosInstance.delete(`/transactions/${id}`)
}

export async function payTransaction(id: string): Promise<Transaction> {
  const response = await axiosInstance.post<Transaction>(`/transactions/${id}/pay`)
  return response.data
}

export async function cancelTransaction(id: string): Promise<Transaction> {
  const response = await axiosInstance.post<Transaction>(`/transactions/${id}/cancel`)
  return response.data
}

export async function listAttachments(id: string): Promise<Attachment[]> {
  const response = await axiosInstance.get<Attachment[]>(`/transactions/${id}/attachments`)
  return response.data
}

export async function uploadAttachment(
  id: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<Attachment> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await axiosInstance.post<Attachment>(
    `/transactions/${id}/attachments`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded * 100) / event.total))
        }
      },
    },
  )
  return response.data
}

export async function deleteAttachment(id: string, attachmentId: string): Promise<void> {
  await axiosInstance.delete(`/transactions/${id}/attachments/${attachmentId}`)
}
