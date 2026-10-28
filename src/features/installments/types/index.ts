export type InstallmentType = 'EXPENSE' | 'INCOME'
export type InstallmentTransactionStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'

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
  /** Soma das parcelas não canceladas (mais a quitação): acompanha edições e antecipações. */
  totalAmount: string
  totalInstallments: number
  paidInstallments: number
  remainingAmount: string
  /** Competência da próxima parcela em aberto; nulo quando não resta nenhuma. */
  nextDueDate?: string | null
  /** Todas as parcelas pagas, sem quitação antecipada. */
  completed: boolean
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

export interface EarlySettlementRequest {
  settlementAmount: string
  settlementDate: string
}

export interface AdvanceInstallmentsRequest {
  installmentIds: string[]
  newPaymentDate: string
  adjustedAmount?: string
}
