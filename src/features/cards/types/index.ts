export type CardBrand = 'VISA' | 'MASTERCARD' | 'ELO' | 'AMEX' | 'HIPERCARD' | 'OTHER'
export type InvoiceStatus = 'OPEN' | 'CLOSED' | 'PAID' | 'PARTIALLY_PAID' | 'PARTIAL' | 'OVERDUE'

export interface Card {
  id: string
  name: string
  brand: CardBrand
  issuer?: string
  creditLimit: string
  currentInvoiceTotal?: string
  closingDay: number
  dueDay: number
  archivedAt: string | null
  sharedLimitGroupId?: string | null
  createdAt: string
  updatedAt?: string
}

export interface InvoiceItem {
  id: string
  description: string
  amount: string
  competenceDate: string
  categoryId: string | null
  categoryName?: string | null
  subcategoryId?: string | null
  subcategoryName?: string | null
  notes?: string
  isRevolving?: boolean
  installmentNumber?: number | null
  totalInstallments?: number | null
  transactionId?: string | null
}

export interface Invoice {
  id: string
  creditCardId: string
  referenceMonth: string
  closingDate?: string
  totalAmount: string
  paidAmount: string
  status: InvoiceStatus
  dueDate: string
  items: InvoiceItem[]
}

export interface LimitUsage {
  cardId?: string
  creditLimit: string
  usedLimit: string
  availableLimit: string
  usagePercentage?: string
}

export interface SpendingItem {
  categoryId: string | null
  categoryName: string | null
  totalAmount: string
  percentage: string
}

export interface CreateCardRequest {
  name: string
  brand: CardBrand
  issuer?: string
  creditLimit: string
  closingDay: number
  dueDay: number
}

export type UpdateCardRequest = CreateCardRequest

export interface RecordChargeRequest {
  description: string
  amount: string
  categoryId?: string
  date: string
}

export interface PayInvoiceRequest {
  amount: string
  accountId: string
}

export interface SpendingBreakdownParams {
  from: string
  to: string
}
