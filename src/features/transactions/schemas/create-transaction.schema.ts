import { z } from 'zod'

export const TRANSACTION_TYPES = ['INCOME', 'EXPENSE', 'REFUND', 'ADJUSTMENT'] as const
export const TRANSACTION_STATUSES = ['PENDING', 'PAID', 'CANCELLED'] as const

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

export const createTransactionSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .max(255, 'Description must be at most 255 characters'),
  amount: z.string().regex(DECIMAL_PATTERN, 'Amount must be a valid decimal amount (e.g. 150.75)'),
  type: z.enum(TRANSACTION_TYPES),
  accountId: z.string().min(1, 'Account is required'),
  categoryId: z.string().optional(),
  competenceDate: z.string().min(1, 'Date is required'),
  status: z.enum(TRANSACTION_STATUSES),
})

export type CreateTransactionFormValues = z.infer<typeof createTransactionSchema>
