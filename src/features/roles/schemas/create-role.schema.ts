import { z } from 'zod'

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .transform((v) => v.toUpperCase()),
  description: z.string().max(255, 'Description must be at most 255 characters').optional(),
})

export type CreateRoleFormValues = z.infer<typeof createRoleSchema>
