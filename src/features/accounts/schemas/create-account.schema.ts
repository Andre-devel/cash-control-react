import { z } from 'zod'

export const ACCOUNT_TYPES = [
  'CHECKING',
  'SAVINGS',
  'CASH',
  'INVESTMENT',
  'CREDIT',
  'OTHER',
] as const

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  type: z.enum(ACCOUNT_TYPES),
  currencyCode: z
    .string()
    .min(1, 'Moeda é obrigatória')
    .max(10, 'Moeda deve ter no máximo 10 caracteres'),
  initialBalance: z
    .string()
    .regex(DECIMAL_PATTERN, 'Saldo inicial deve ser um valor decimal válido (ex: 1500.00)'),
  description: z.string().optional(),
})

export type CreateAccountFormValues = z.infer<typeof createAccountSchema>
