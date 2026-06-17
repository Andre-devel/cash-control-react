import { z } from 'zod'

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

export const updateRecurrenceSchema = z.object({
  description: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),
  amount: z.string().regex(DECIMAL_PATTERN, 'Valor deve ser um decimal válido (ex: 150.00)'),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  categoryId: z.string().optional(),
})

export type UpdateRecurrenceFormValues = z.infer<typeof updateRecurrenceSchema>
