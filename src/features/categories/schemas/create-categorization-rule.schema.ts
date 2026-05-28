import { z } from 'zod'

export const createCategorizationRuleSchema = z.object({
  pattern: z
    .string()
    .min(1, 'Pattern is required')
    .max(200, 'Pattern must be at most 200 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  subcategoryId: z.string().optional(),
  accountId: z.string().optional(),
})

export type CreateCategorizationRuleFormValues = z.infer<typeof createCategorizationRuleSchema>
