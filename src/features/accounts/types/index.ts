export type AccountType = 'CHECKING' | 'SAVINGS' | 'CASH' | 'INVESTMENT' | 'CREDIT' | 'OTHER'

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: string
  currencyCode: string
  description?: string
  sortOrder: number
  archivedAt: string | null
  createdAt: string
  updatedAt?: string
}

export interface ListAccountsParams {
  includeArchived?: boolean
}

export interface CreateAccountRequest {
  name: string
  type: AccountType
  currencyCode?: string
  initialBalance?: string
  description?: string
}

export interface UpdateAccountRequest {
  name: string
  type: AccountType
  currencyCode?: string
  description?: string
}

export interface AdjustBalanceRequest {
  amount: string
  note?: string
}

export interface CreateTransferRequest {
  sourceAccountId: string
  destinationAccountId: string
  amount: string
  date: string
  description?: string
}
