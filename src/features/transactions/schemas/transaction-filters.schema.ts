import { z } from 'zod'
import { TRANSACTION_TYPES, TRANSACTION_STATUSES } from './create-transaction.schema'

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

export const TRANSACTION_FILTER_TYPES = [...TRANSACTION_TYPES, 'TRANSFER'] as const

export const transactionFiltersSchema = z.object({
  accountId: z.string().optional(),
  type: z.enum(TRANSACTION_FILTER_TYPES).optional(),
  status: z.enum(TRANSACTION_STATUSES).optional(),
  categoryId: z.string().optional(),
  competenceDateFrom: z.string().optional(),
  competenceDateTo: z.string().optional(),
  paymentDateFrom: z.string().optional(),
  paymentDateTo: z.string().optional(),
  amountMin: z
    .string()
    .regex(DECIMAL_PATTERN, 'Minimum amount must be a valid decimal')
    .optional()
    .or(z.literal('')),
  amountMax: z
    .string()
    .regex(DECIMAL_PATTERN, 'Maximum amount must be a valid decimal')
    .optional()
    .or(z.literal('')),
  searchText: z.string().optional(),
  includeCancelled: z.boolean().optional(),
  page: z.number().int().min(0).optional(),
  size: z.number().int().min(1).optional(),
  sort: z.string().optional(),
})

export type TransactionFiltersValues = z.infer<typeof transactionFiltersSchema>
