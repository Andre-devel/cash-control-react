import { z } from 'zod'
import { moneyField } from '@/lib/money'

export const recordChargeSchema = z.object({
  description: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),
  amount: moneyField('Valor deve ser um decimal válido (ex: 150,00)'),
  categoryId: z.string().optional(),
  date: z.string().min(1, 'Data é obrigatória'),
})

export type RecordChargeFormValues = z.infer<typeof recordChargeSchema>
