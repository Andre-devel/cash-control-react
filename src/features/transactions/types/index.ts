export type TransactionType = 'INCOME' | 'EXPENSE' | 'REFUND' | 'ADJUSTMENT'
export type TransactionStatus = 'PENDING' | 'PAID' | 'CANCELLED'

export interface Transaction {
  id: string
  description: string
  amount: string
  type: TransactionType
  status: TransactionStatus
  accountId: string
  categoryId: string | null
  competenceDate: string
  paymentDate: string | null
  createdAt: string
}

export interface Attachment {
  id: string
  transactionId: string
  fileName: string
  contentType: string
  size: number
  url: string
  createdAt: string
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface ListTransactionsParams {
  accountId?: string
  type?: TransactionType
  status?: TransactionStatus
  categoryId?: string
  competenceDateFrom?: string
  competenceDateTo?: string
  paymentDateFrom?: string
  paymentDateTo?: string
  amountMin?: string
  amountMax?: string
  searchText?: string
  includeCancelled?: boolean
  page?: number
  size?: number
  sort?: string
}

export interface CreateTransactionRequest {
  description: string
  amount: string
  type: TransactionType
  accountId: string
  categoryId?: string
  competenceDate: string
  status: TransactionStatus
}

export type UpdateTransactionRequest = CreateTransactionRequest
