import { axiosInstance } from '@/services/http'
import type {
  BankConnection,
  BankConnectionsResponse,
  LinkBankAccountRequest,
} from '@/features/bank-connections/types'

export async function listBankConnections(): Promise<BankConnectionsResponse> {
  const response = await axiosInstance.get<BankConnectionsResponse>('/bank-connections')
  return response.data
}

/** Token do widget. Com `connectionId`, o widget renova o consentimento daquela conexão. */
export async function createConnectToken(connectionId?: string): Promise<string> {
  const url = connectionId
    ? `/bank-connections/${connectionId}/connect-token`
    : '/bank-connections/connect-token'
  const response = await axiosInstance.post<{ accessToken: string }>(url)
  return response.data.accessToken
}

export async function registerBankConnection(itemId: string): Promise<BankConnection> {
  const response = await axiosInstance.post<BankConnection>('/bank-connections', { itemId })
  return response.data
}

export async function refreshBankConnection(id: string): Promise<BankConnection> {
  const response = await axiosInstance.post<BankConnection>(`/bank-connections/${id}/refresh`)
  return response.data
}

export async function linkBankAccount(
  connectionId: string,
  bankAccountId: string,
  data: LinkBankAccountRequest,
): Promise<BankConnection> {
  const response = await axiosInstance.put<BankConnection>(
    `/bank-connections/${connectionId}/accounts/${bankAccountId}/link`,
    data,
  )
  return response.data
}

export async function deleteBankConnection(id: string): Promise<void> {
  await axiosInstance.delete(`/bank-connections/${id}`)
}
