import { z } from 'zod'

export const CATEGORY_TYPES = ['INCOME', 'EXPENSE'] as const

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  color: z.string().min(1, 'Color is required'),
  icon: z.string().min(1, 'Icon is required'),
  type: z.enum(CATEGORY_TYPES, { message: 'Type must be INCOME or EXPENSE' }),
  parentId: z.string().optional(),
})

export type CreateCategoryFormValues = z.infer<typeof createCategorySchema>
