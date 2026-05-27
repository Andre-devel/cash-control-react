import { z } from 'zod'

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

export const adjustBalanceSchema = z.object({
  targetBalance: z
    .string()
    .regex(DECIMAL_PATTERN, 'Target balance must be a valid decimal amount (e.g. 2500.00)'),
  note: z.string().optional(),
})

export type AdjustBalanceFormValues = z.infer<typeof adjustBalanceSchema>
