import { z } from 'zod'

export const TRANSACTION_TYPES = ['INCOME', 'EXPENSE', 'REFUND', 'ADJUSTMENT'] as const
export const TRANSACTION_STATUSES = ['PENDING', 'PAID', 'CANCELLED'] as const

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

export const createTransactionSchema = z.object({
  description: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),
  amount: z.string().regex(DECIMAL_PATTERN, 'Valor deve ser um número decimal válido (ex: 150.75)'),
  type: z.enum(TRANSACTION_TYPES),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  categoryId: z.string().optional(),
  competenceDate: z.string().min(1, 'Data é obrigatória'),
  status: z.enum(TRANSACTION_STATUSES),
})

export type CreateTransactionFormValues = z.infer<typeof createTransactionSchema>
