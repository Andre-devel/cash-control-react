import { z } from 'zod'

export const createCategorizationRuleSchema = z.object({
  pattern: z
    .string()
    .min(1, 'Pattern is required')
    .max(200, 'Pattern must be at most 200 characters'),
  categoryId: z.string().min(1, 'Category is required'),
})

export type CreateCategorizationRuleFormValues = z.infer<typeof createCategorizationRuleSchema>
