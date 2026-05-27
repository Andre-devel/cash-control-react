import { z } from 'zod'

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

export const updateInstallmentSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .max(255, 'Description must be at most 255 characters'),
  amount: z.string().regex(DECIMAL_PATTERN, 'Amount must be a valid decimal amount (e.g. 300.00)'),
  dueDate: z.string().min(1, 'Due date is required'),
})

export type UpdateInstallmentFormValues = z.infer<typeof updateInstallmentSchema>
