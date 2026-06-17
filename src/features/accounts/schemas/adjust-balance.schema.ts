import { z } from 'zod'

const SIGNED_DECIMAL_PATTERN = /^-?\d+(\.\d{1,2})?$/

export const adjustBalanceSchema = z.object({
  amount: z
    .string()
    .regex(SIGNED_DECIMAL_PATTERN, 'Valor deve ser um decimal válido (ex: 100.00 ou -50.00)'),
  note: z.string().optional(),
})

export type AdjustBalanceFormValues = z.infer<typeof adjustBalanceSchema>
