import { z } from 'zod'

export const ACCOUNT_TYPES = [
  'CHECKING',
  'SAVINGS',
  'CASH',
  'INVESTMENT',
  'CREDIT',
  'OTHER',
] as const

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  type: z.enum(ACCOUNT_TYPES),
  currency: z
    .string()
    .min(1, 'Currency is required')
    .max(10, 'Currency must be at most 10 characters'),
  initialBalance: z
    .string()
    .regex(DECIMAL_PATTERN, 'Initial balance must be a valid decimal amount (e.g. 1500.00)'),
  color: z.string().min(1, 'Color is required'),
  icon: z.string().min(1, 'Icon is required'),
  description: z.string().optional(),
})

export type CreateAccountFormValues = z.infer<typeof createAccountSchema>
