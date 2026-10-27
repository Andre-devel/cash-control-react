import { z } from 'zod'

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
})

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>
