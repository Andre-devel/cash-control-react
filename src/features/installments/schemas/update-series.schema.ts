import { z } from 'zod'

export const updateSeriesSchema = z.object({
  description: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  categoryId: z.string().optional(),
  notes: z.string().max(255, 'Observações devem ter no máximo 255 caracteres').optional(),
})

export type UpdateSeriesFormValues = z.infer<typeof updateSeriesSchema>
