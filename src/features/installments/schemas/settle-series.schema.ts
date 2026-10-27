import { z } from 'zod'
import { moneyField } from '@/lib/money'

export const settleSeriesSchema = z.object({
  settlementAmount: moneyField('Valor deve ser um decimal válido (ex: 1250,40)').refine(
    (val) => parseFloat(val) > 0,
    'Valor deve ser maior que zero',
  ),
  settlementDate: z.string().min(1, 'Data é obrigatória'),
})

export type SettleSeriesFormValues = z.infer<typeof settleSeriesSchema>
