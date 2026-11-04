import { axiosInstance } from '@/services/http'
import type {
  Account,
  ListAccountsParams,
  CreateAccountRequest,
  UpdateAccountRequest,
  AdjustBalanceRequest,
  CreateTransferRequest,
  AccountReconciliation,
  CardReconciliation,
  ReconcileCardRequest,
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

export async function archiveAccount(id: string): Promise<Account> {
  const response = await axiosInstance.post<Account>(`/accounts/${id}/archive`)
  return response.data
}

export async function unarchiveAccount(id: string): Promise<Account> {
  const response = await axiosInstance.post<Account>(`/accounts/${id}/unarchive`)
  return response.data
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

export async function getAccountReconciliation(id: string): Promise<AccountReconciliation> {
  const response = await axiosInstance.get<AccountReconciliation>(`/accounts/${id}/reconciliation`)
  return response.data
}

/** Leva o saldo do app ao do banco com um único ajuste flutuante por conta. */
export async function reconcileAccount(id: string): Promise<AccountReconciliation> {
  const response = await axiosInstance.post<AccountReconciliation>(`/accounts/${id}/reconcile`)
  return response.data
}

export async function getCardReconciliation(cardId: string): Promise<CardReconciliation> {
  const response = await axiosInstance.get<CardReconciliation>(`/cards/${cardId}/reconciliation`)
  return response.data
}

/** Lança a diferença como despesa avulsa na fatura aberta do cartão. */
export async function reconcileCard(cardId: string, data: ReconcileCardRequest): Promise<void> {
  await axiosInstance.post(`/cards/${cardId}/reconcile`, data)
}
