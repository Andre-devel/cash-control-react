export type InstallmentType = 'EXPENSE' | 'INCOME'
export type InstallmentSeriesStatus = 'ACTIVE' | 'SETTLED'
export type InstallmentTransactionStatus = 'PENDING' | 'PAID' | 'OVERDUE'

export interface InstallmentTransaction {
  id: string
  description: string
  amount: string
  dueDate: string
  status: InstallmentTransactionStatus
  installmentNumber: number
}

export interface InstallmentSeries {
  id: string
  description: string
  totalAmount: string
  installmentCount: number
  paidCount: number
  remainingAmount: string
  remainingCount?: number
  accountId: string
  categoryId: string | null
  firstDueDate: string
  nextDueDate: string | null
  type: InstallmentType
  status: InstallmentSeriesStatus
  createdAt: string
}

export interface InstallmentSeriesDetail extends InstallmentSeries {
  amount: string
  remainingCount: number
  notes?: string
  transactions: InstallmentTransaction[]
}

export interface CreateInstallmentSeriesRequest {
  description: string
  totalAmount: string
  installmentCount: number
  accountId: string
  categoryId?: string
  firstDueDate: string
  type: InstallmentType
}

export interface EditSeriesRequest {
  description: string
  accountId: string
  categoryId?: string
  notes?: string
}

export interface UpdateInstallmentRequest {
  description: string
  amount: string
  dueDate: string
}

export interface AdvanceInstallmentsRequest {
  transactionIds: string[]
  newDate: string
  newAmount?: string
}
