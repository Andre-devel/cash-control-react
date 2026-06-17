import { z } from 'zod'

const COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  color: z
    .string()
    .regex(COLOR_PATTERN, 'Cor deve ser um hexadecimal válido (ex: #4CAF50)')
    .optional()
    .or(z.literal('')),
  icon: z.string().max(50).optional().or(z.literal('')),
  parentId: z.string().optional(),
})

export type CreateCategoryFormValues = z.infer<typeof createCategorySchema>
