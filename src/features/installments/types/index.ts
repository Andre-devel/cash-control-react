export type InstallmentType = 'EXPENSE' | 'INCOME'
export type InstallmentSeriesStatus = 'ACTIVE' | 'SETTLED'

export interface InstallmentSeries {
  id: string
  description: string
  totalAmount: string
  installmentCount: number
  paidCount: number
  remainingAmount: string
  accountId: string
  categoryId: string | null
  firstDueDate: string
  nextDueDate: string | null
  type: InstallmentType
  status: InstallmentSeriesStatus
  createdAt: string
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

export interface UpdateSeriesRequest {
  description: string
  accountId: string
  categoryId?: string
}

export interface UpdateInstallmentRequest {
  description: string
  amount: string
  dueDate: string
}

export interface AdvanceInstallmentsRequest {
  seriesId: string
  count: number
}
