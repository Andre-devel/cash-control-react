import { axiosInstance } from '@/services/http'
import type {
  Account,
  ListAccountsParams,
  CreateAccountRequest,
  UpdateAccountRequest,
  AdjustBalanceRequest,
  CreateTransferRequest,
} from '@/features/accounts/types'

export async function listAccounts(params?: ListAccountsParams): Promise<Account[]> {
  const response = await axiosInstance.get<Account[]>('/accounts', { params })
  return response.data
}

export async function getAccount(id: string): Promise<Account> {
  const response = await axiosInstance.get<Account>(`/accounts/${id}`)
  return response.data
}

export async function createAccount(data: CreateAccountRequest): Promise<Account> {
  const response = await axiosInstance.post<Account>('/accounts', data)
  return response.data
}

export async function updateAccount(id: string, data: UpdateAccountRequest): Promise<Account> {
  const response = await axiosInstance.put<Account>(`/accounts/${id}`, data)
  return response.data
}

export async function deleteAccount(id: string): Promise<void> {
  await axiosInstance.delete(`/accounts/${id}`)
}

export async function archiveAccount(id: string): Promise<void> {
  await axiosInstance.post(`/accounts/${id}/archive`)
}

export async function unarchiveAccount(id: string): Promise<void> {
  await axiosInstance.post(`/accounts/${id}/unarchive`)
}

export async function adjustBalance(id: string, data: AdjustBalanceRequest): Promise<Account> {
  const response = await axiosInstance.post<Account>(`/accounts/${id}/adjust`, data)
  return response.data
}

export async function createTransfer(data: CreateTransferRequest): Promise<void> {
  await axiosInstance.post('/accounts/transfers', data)
}

export async function deleteTransfer(groupId: string): Promise<void> {
  await axiosInstance.delete(`/accounts/transfers/${groupId}`)
}
