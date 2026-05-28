import { z } from 'zod'

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

export const updateTransactionSchema = z.object({
  description: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),
  amount: z.string().regex(DECIMAL_PATTERN, 'Valor deve ser um número decimal válido (ex: 150.75)'),
  categoryId: z.string().optional(),
  competenceDate: z.string().min(1, 'Data é obrigatória'),
  notes: z.string().max(1000, 'Notas deve ter no máximo 1000 caracteres').optional(),
})

export type UpdateTransactionFormValues = z.infer<typeof updateTransactionSchema>
