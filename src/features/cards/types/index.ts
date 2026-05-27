export type CardBrand = 'VISA' | 'MASTERCARD' | 'ELO' | 'AMEX' | 'HIPERCARD' | 'OTHER'
export type InvoiceStatus = 'OPEN' | 'CLOSED' | 'PAID' | 'PARTIALLY_PAID'

export interface Card {
  id: string
  name: string
  brand: CardBrand
  lastFourDigits: string
  creditLimit: string
  billingCycleDay: number
  dueDay: number
  color: string
  archived: boolean
  createdAt: string
}

export interface InvoiceItem {
  id: string
  description: string
  amount: string
  date: string
  categoryId: string | null
}

export interface Invoice {
  id: string
  cardId: string
  referenceMonth: string
  totalAmount: string
  paidAmount: string
  remainingAmount: string
  status: InvoiceStatus
  dueDate: string
  items: InvoiceItem[]
}

export interface LimitUsage {
  creditLimit: string
  usedAmount: string
  availableAmount: string
}

export interface SpendingItem {
  categoryId: string | null
  categoryName: string | null
  amount: string
  percentage: string
}

export interface SpendingBreakdown {
  items: SpendingItem[]
  totalAmount: string
}

export interface CreateCardRequest {
  name: string
  brand: CardBrand
  lastFourDigits: string
  creditLimit: string
  billingCycleDay: number
  dueDay: number
  color: string
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
