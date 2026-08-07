import { z } from 'zod'
import { TRANSACTION_TYPES, TRANSACTION_STATUSES } from './create-transaction.schema'
import { PAYMENT_METHOD_SLUGS } from '@/features/transactions/types'
import { moneyField } from '@/lib/money'

export const TRANSACTION_FILTER_TYPES = [...TRANSACTION_TYPES, 'TRANSFER'] as const

export const transactionFiltersSchema = z.object({
  accountId: z.string().optional(),
  type: z.enum(TRANSACTION_FILTER_TYPES).optional(),
  status: z.enum(TRANSACTION_STATUSES).optional(),
  categoryId: z.string().optional(),
  paymentMethod: z.enum(PAYMENT_METHOD_SLUGS).optional(),
  competenceDateFrom: z.string().optional(),
  competenceDateTo: z.string().optional(),
  paymentDateFrom: z.string().optional(),
  paymentDateTo: z.string().optional(),
  amountMin: moneyField('Valor mínimo deve ser um decimal válido').optional().or(z.literal('')),
  amountMax: moneyField('Valor máximo deve ser um decimal válido').optional().or(z.literal('')),
  searchText: z.string().optional(),
  includeCancelled: z.boolean().optional(),
  page: z.number().int().min(0).optional(),
  size: z.number().int().min(1).optional(),
  sort: z.string().optional(),
})

export type TransactionFiltersValues = z.infer<typeof transactionFiltersSchema>
