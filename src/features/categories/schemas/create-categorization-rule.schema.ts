import { z } from 'zod'

export const createCategorizationRuleSchema = z.object({
  pattern: z
    .string()
    .min(1, 'Padrão é obrigatório')
    .max(200, 'Padrão deve ter no máximo 200 caracteres'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  subcategoryId: z.string().optional(),
  accountId: z.string().optional(),
})

export type CreateCategorizationRuleFormValues = z.infer<typeof createCategorizationRuleSchema>
