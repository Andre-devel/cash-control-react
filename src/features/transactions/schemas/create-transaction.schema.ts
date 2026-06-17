import { z } from 'zod'
import { PAYMENT_METHOD_SLUGS } from '@/features/transactions/types'

export const TRANSACTION_TYPES = ['INCOME', 'EXPENSE', 'REFUND'] as const
export const TRANSACTION_STATUSES = ['PENDING', 'PAID', 'CANCELLED'] as const

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

export const createTransactionSchema = z
  .object({
    description: z
      .string()
      .min(1, 'Descrição é obrigatória')
      .max(255, 'Descrição deve ter no máximo 255 caracteres'),
    amount: z
      .string()
      .regex(DECIMAL_PATTERN, 'Valor deve ser um número decimal válido (ex: 150.75)'),
    type: z.enum(TRANSACTION_TYPES),
    accountId: z.string().min(1, 'Conta é obrigatória'),
    categoryId: z.string().optional(),
    competenceDate: z.string().min(1, 'Data é obrigatória'),
    status: z.enum(TRANSACTION_STATUSES),
    paymentMethod: z.enum(PAYMENT_METHOD_SLUGS),
    creditCardId: z.string().optional(),
    installments: z.number().int('Número de parcelas deve ser inteiro').min(1, 'Mínimo 1 parcela'),
  })
  .refine((data) => data.paymentMethod !== 'CREDIT_CARD' || !!data.creditCardId, {
    message: 'Selecione um cartão de crédito',
    path: ['creditCardId'],
  })
  .refine((data) => data.paymentMethod === 'CREDIT_CARD' || !data.creditCardId, {
    message: 'Cartão de crédito não se aplica a esta forma de pagamento',
    path: ['creditCardId'],
  })

export type CreateTransactionFormValues = z.infer<typeof createTransactionSchema>
