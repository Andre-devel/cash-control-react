import { z } from 'zod'
import { moneyField } from '@/lib/money'

export const adjustBalanceSchema = z.object({
  amount: moneyField('Valor deve ser um decimal válido (ex: 100,00 ou -50,00)', { signed: true }),
  note: z.string().optional(),
})

export type AdjustBalanceFormValues = z.infer<typeof adjustBalanceSchema>
