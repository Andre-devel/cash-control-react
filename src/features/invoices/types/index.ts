import type { Invoice, InvoiceItem, InvoiceSummary } from '@/features/cards/types'

export type { Invoice, InvoiceItem, InvoiceSummary }

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface UpdateInvoiceItemRequest {
  description: string
  categoryId: string | null
  subcategoryId: string | null
  /** Grava a descrição como o apelido lembrado deste estabelecimento. */
  rememberMerchant: boolean
  /** Aplica a mesma descrição e categoria aos demais lançamentos não cancelados do
   * mesmo estabelecimento, em qualquer fatura. */
  applyToHistory: boolean
}

export interface UpdateInvoiceItemResponse {
  item: InvoiceItem
  updatedRelatedItems: number
}

export interface MerchantScope {
  merchantKey: string | null
  originalDescription: string | null
  currentAliasName: string | null
  relatedItemCount: number
}
