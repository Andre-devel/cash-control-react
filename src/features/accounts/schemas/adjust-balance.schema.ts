import { z } from 'zod'

const SIGNED_DECIMAL_PATTERN = /^-?\d+(\.\d{1,2})?$/

export const adjustBalanceSchema = z.object({
  amount: z
    .string()
    .regex(SIGNED_DECIMAL_PATTERN, 'Amount must be a signed decimal (e.g. 100.00 or -50.00)'),
  note: z.string().optional(),
})

export type AdjustBalanceFormValues = z.infer<typeof adjustBalanceSchema>
