import { z } from 'zod'

export const RECURRENCE_FREQUENCIES = [
  'DAILY',
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
] as const

export const RECURRENCE_TYPES = ['INCOME', 'EXPENSE', 'REFUND'] as const

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

export const createRecurrenceSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .max(255, 'Description must be at most 255 characters'),
  amount: z.string().regex(DECIMAL_PATTERN, 'Amount must be a valid decimal amount (e.g. 150.00)'),
  frequency: z.enum(RECURRENCE_FREQUENCIES, { message: 'Frequency is required' }),
  type: z.enum(RECURRENCE_TYPES, { message: 'Type is required' }),
  accountId: z.string().min(1, 'Account is required'),
  categoryId: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
})

export type CreateRecurrenceFormValues = z.infer<typeof createRecurrenceSchema>
