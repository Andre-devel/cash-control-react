import { axiosInstance } from '@/services/http'
import type { ImportCommitRow } from '@/features/transactions/types'
import type {
  BankPendingConfirmAllResponse,
  BankPendingConfirmResponse,
  BankPendingItem,
} from '@/features/bank-connections/types'

export async function listBankPending(): Promise<BankPendingItem[]> {
  const response = await axiosInstance.get<BankPendingItem[]>('/bank-pending')
  return response.data
}

export async function countBankPending(): Promise<number> {
  const response = await axiosInstance.get<{ count: number }>('/bank-pending/count')
  return response.data.count
}

/** Sem `edits`, grava como a fila sugere. Data, valor e chave são sempre os do banco. */
export async function confirmBankPending(
  id: string,
  edits?: ImportCommitRow,
): Promise<BankPendingConfirmResponse> {
  const response = await axiosInstance.post<BankPendingConfirmResponse>(
    `/bank-pending/${id}/confirm`,
    edits,
  )
  return response.data
}

export async function confirmAllBankPending(): Promise<BankPendingConfirmAllResponse> {
  const response = await axiosInstance.post<BankPendingConfirmAllResponse>(
    '/bank-pending/confirm-all',
  )
  return response.data
}

export async function discardBankPending(id: string): Promise<void> {
  await axiosInstance.delete(`/bank-pending/${id}`)
}
