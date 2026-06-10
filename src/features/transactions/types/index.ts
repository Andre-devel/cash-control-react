export type TransactionType = 'INCOME' | 'EXPENSE' | 'REFUND' | 'TRANSFER'
export type TransactionStatus = 'PENDING' | 'PAID' | 'CANCELLED'

export const PAYMENT_METHOD_SLUGS = [
  'CASH',
  'PIX',
  'DEBIT_CARD',
  'CREDIT_CARD',
  'BANK_TRANSFER',
  'BOLETO',
  'OTHER',
] as const
export type PaymentMethodSlug = (typeof PAYMENT_METHOD_SLUGS)[number]

export interface PaymentMethod {
  id: string
  slug: PaymentMethodSlug
  name: string
}

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
  paymentMethod: PaymentMethod
  creditCard: { id: string; name: string; brand: string } | null
  notes?: string
  accountName?: string
  categoryName?: string
  isInstallment?: boolean
  installmentNumber?: number
  installmentCount?: number
  installmentGroupId?: string
  recurrenceId?: string
  updatedAt?: string
}

export interface TransactionSummary {
  id: string
  description: string
  amount: string
  type: TransactionType
  status: TransactionStatus
  accountId: string
  accountName?: string
  categoryId: string | null
  categoryName?: string
  competenceDate: string
  paymentDate: string | null
  createdAt: string
  paymentMethod: PaymentMethod
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
  paymentMethod?: PaymentMethodSlug
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
  notes?: string
}

export interface UpdateTransactionRequest {
  description: string
  amount: string
  categoryId?: string
  competenceDate: string
  notes?: string
}

export interface MarkAsPaidRequest {
  paymentDate?: string
}
