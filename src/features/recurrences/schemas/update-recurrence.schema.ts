import { z } from 'zod'
import { RECURRENCE_FREQUENCIES, RECURRENCE_TYPES } from './create-recurrence.schema'

export { RECURRENCE_FREQUENCIES, RECURRENCE_TYPES } from './create-recurrence.schema'

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

export const updateRecurrenceSchema = z.object({
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
  endDate: z.string().optional(),
})

export type UpdateRecurrenceFormValues = z.infer<typeof updateRecurrenceSchema>
