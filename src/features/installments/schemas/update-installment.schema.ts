import { z } from 'zod'
import { moneyField } from '@/lib/money'

export const updateInstallmentSchema = z.object({
  description: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),
  amount: moneyField('Valor deve ser um decimal válido (ex: 300,00)'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
})

export type UpdateInstallmentFormValues = z.infer<typeof updateInstallmentSchema>
