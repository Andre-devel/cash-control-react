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
  /** Delta com sinal: positivo aumenta o saldo. */
  amount: string
  description?: string
}

export interface CreateTransferRequest {
  sourceAccountId: string
  destinationAccountId: string
  amount: string
  date: string
  description?: string
}

/**
 * Saldo do app ao lado do último saldo lido do banco. `bankBalance`, `bankBalanceAt` e
 * `difference` são nulos quando a conta não está vinculada ou o banco ainda não informou saldo.
 * `difference = bankBalance - appBalance`: o valor que o ajuste lançaria.
 */
export interface AccountReconciliation {
  appBalance: string
  bankBalance: string | null
  bankBalanceAt: string | null
  difference: string | null
}

/**
 * Uso do limite do cartão segundo o banco ao lado do que o app calcula. Campos do banco e
 * `difference` nulos quando o cartão não está vinculado ou o banco não informou o limite.
 * `difference = bankUsed - appUsed`: o que falta lançar no app.
 */
export interface CardReconciliation {
  bankLimit: string | null
  bankAvailable: string | null
  bankUsed: string | null
  appUsed: string
  difference: string | null
  openInvoiceId: string | null
}

export interface ReconcileCardRequest {
  amount: string
  description?: string
}
