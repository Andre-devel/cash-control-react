export type AccountType = 'CHECKING' | 'SAVINGS' | 'CASH' | 'INVESTMENT' | 'CREDIT' | 'OTHER'

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: string
  currency: string
  color: string
  icon: string
  archived: boolean
  createdAt: string
}

export interface ListAccountsParams {
  includeArchived?: boolean
}

export interface CreateAccountRequest {
  name: string
  type: AccountType
  currency: string
  balance: string
  color: string
  icon: string
}

export type UpdateAccountRequest = CreateAccountRequest

export interface AdjustBalanceRequest {
  targetBalance: string
  note?: string
}

export interface CreateTransferRequest {
  fromAccountId: string
  toAccountId: string
  amount: string
  date: string
  description?: string
}
