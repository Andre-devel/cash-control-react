import { z } from 'zod'
import { ACCOUNT_TYPES } from './create-account.schema'

export const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  type: z.enum(ACCOUNT_TYPES),
  currency: z
    .string()
    .min(1, 'Currency is required')
    .max(10, 'Currency must be at most 10 characters'),
  color: z.string().min(1, 'Color is required'),
  icon: z.string().min(1, 'Icon is required'),
  description: z.string().optional(),
})

export type UpdateAccountFormValues = z.infer<typeof updateAccountSchema>
