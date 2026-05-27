import { z } from 'zod'

export const INSTALLMENT_TYPES = ['EXPENSE', 'INCOME'] as const

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

export const createInstallmentSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .max(255, 'Description must be at most 255 characters'),
  totalAmount: z
    .string()
    .regex(DECIMAL_PATTERN, 'Total amount must be a valid decimal amount (e.g. 3600.00)'),
  installmentCount: z
    .number()
    .int('Installment count must be a whole number')
    .min(2, 'Installment count must be at least 2'),
  accountId: z.string().min(1, 'Account is required'),
  categoryId: z.string().optional(),
  firstDueDate: z.string().min(1, 'First due date is required'),
  type: z.enum(INSTALLMENT_TYPES),
})

export type CreateInstallmentFormValues = z.infer<typeof createInstallmentSchema>
