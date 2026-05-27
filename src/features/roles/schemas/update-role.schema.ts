import { z } from 'zod'

export const updateRoleSchema = z.object({
  description: z.string().max(255, 'Description must be at most 255 characters').optional(),
})

export type UpdateRoleFormValues = z.infer<typeof updateRoleSchema>
