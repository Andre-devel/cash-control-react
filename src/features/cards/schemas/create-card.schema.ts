import { z } from 'zod'

export const CARD_BRANDS = ['VISA', 'MASTERCARD', 'ELO', 'AMEX', 'HIPERCARD', 'OTHER'] as const

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

export const createCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  brand: z.enum(CARD_BRANDS, { message: 'Bandeira é obrigatória' }),
  issuer: z.string().max(100).optional(),
  creditLimit: z
    .string()
    .regex(DECIMAL_PATTERN, 'Limite deve ser um valor decimal válido (ex: 5000.00)'),
  closingDay: z
    .number()
    .int('Dia de fechamento deve ser um número inteiro')
    .min(1, 'Dia de fechamento deve estar entre 1 e 28')
    .max(28, 'Dia de fechamento deve estar entre 1 e 28'),
  dueDay: z
    .number()
    .int('Dia de vencimento deve ser um número inteiro')
    .min(1, 'Dia de vencimento deve estar entre 1 e 28')
    .max(28, 'Dia de vencimento deve estar entre 1 e 28'),
})

export type CreateCardFormValues = z.infer<typeof createCardSchema>
