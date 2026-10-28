import { z } from 'zod'
import { ACCOUNT_TYPES } from './create-account.schema'

export const updateAccountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  type: z.enum(ACCOUNT_TYPES),
  // Só exibida: a moeda é fixa depois da criação.
  currencyCode: z.string(),
  description: z.string().optional(),
})

export type UpdateAccountFormValues = z.infer<typeof updateAccountSchema>
