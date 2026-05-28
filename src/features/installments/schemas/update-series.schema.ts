import { z } from 'zod'

export const updateSeriesSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .max(255, 'Description must be at most 255 characters'),
  accountId: z.string().min(1, 'Account is required'),
  categoryId: z.string().optional(),
  notes: z.string().max(255, 'Notes must be at most 255 characters').optional(),
})

export type UpdateSeriesFormValues = z.infer<typeof updateSeriesSchema>
