import { z } from 'zod'

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

export const createTransferSchema = z
  .object({
    fromAccountId: z.string().min(1, 'Source account is required'),
    toAccountId: z.string().min(1, 'Destination account is required'),
    amount: z
      .string()
      .regex(DECIMAL_PATTERN, 'Amount must be a valid decimal amount (e.g. 500.00)'),
    date: z.string().min(1, 'Date is required'),
    description: z.string().optional(),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: 'Source and destination accounts must be different',
    path: ['toAccountId'],
  })

export type CreateTransferFormValues = z.infer<typeof createTransferSchema>
