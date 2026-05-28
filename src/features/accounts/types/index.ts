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
  description?: string
  displayOrder?: number
  createdAt: string
}

export interface ListAccountsParams {
  includeArchived?: boolean
}

export interface CreateAccountRequest {
  name: string
  type: AccountType
  currency: string
  initialBalance: string
  color: string
  icon: string
  description?: string
}

export interface UpdateAccountRequest {
  name: string
  type: AccountType
  currency: string
  color: string
  icon: string
  description?: string
}

export interface AdjustBalanceRequest {
  amount: string
  note?: string
}

export interface CreateTransferRequest {
  fromAccountId: string
  toAccountId: string
  amount: string
  date: string
  description?: string
}
