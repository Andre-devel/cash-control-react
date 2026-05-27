import { z } from 'zod'

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

export const recordChargeSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .max(255, 'Description must be at most 255 characters'),
  amount: z.string().regex(DECIMAL_PATTERN, 'Amount must be a valid decimal amount (e.g. 150.00)'),
  categoryId: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
})

export type RecordChargeFormValues = z.infer<typeof recordChargeSchema>
