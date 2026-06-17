export type InstallmentType = 'EXPENSE' | 'INCOME'
export type InstallmentTransactionStatus = 'PENDING' | 'PAID' | 'OVERDUE'

export interface InstallmentTransaction {
  id: string
  description: string
  amount: string
  competenceDate: string
  paymentDate?: string | null
  status: InstallmentTransactionStatus
  installmentNumber?: number
  accountId?: string
  accountName?: string
  categoryId?: string | null
  categoryName?: string | null
}

export interface InstallmentSeries {
  id: string
  description: string
  totalAmount: string
  totalInstallments: number
  firstPaymentDate: string
  accountId: string
  accountName?: string | null
  categoryId: string | null
  categoryName?: string | null
  settled: boolean
  settledAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface InstallmentSeriesDetail {
  series: InstallmentSeries
  installments: InstallmentTransaction[]
}

export interface CreateInstallmentSeriesRequest {
  description: string
  totalAmount: string
  totalInstallments: number
  accountId: string
  categoryId?: string
  firstPaymentDate: string
  notes?: string
  paymentMethod?: string
  creditCardId?: string
}

export interface EditSeriesRequest {
  description?: string
  accountId?: string
  categoryId?: string
  notes?: string
}

export interface UpdateInstallmentRequest {
  description: string
  amount: string
  competenceDate: string
}

export interface AdvanceInstallmentsRequest {
  installmentIds: string[]
  newPaymentDate: string
  adjustedAmount?: string
}
