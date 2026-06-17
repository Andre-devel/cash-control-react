import { z } from 'zod'

export const updateRoleSchema = z.object({
  description: z.string().max(255, 'Descrição deve ter no máximo 255 caracteres').optional(),
})

export type UpdateRoleFormValues = z.infer<typeof updateRoleSchema>
