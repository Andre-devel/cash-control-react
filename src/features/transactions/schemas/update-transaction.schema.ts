import { z } from 'zod'
import { PAYMENT_METHOD_SLUGS } from '@/features/transactions/types'

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

export const updateTransactionSchema = z
  .object({
    description: z
      .string()
      .min(1, 'Descrição é obrigatória')
      .max(255, 'Descrição deve ter no máximo 255 caracteres'),
    amount: z
      .string()
      .regex(DECIMAL_PATTERN, 'Valor deve ser um número decimal válido (ex: 150.75)'),
    categoryId: z.string().optional(),
    competenceDate: z.string().min(1, 'Data é obrigatória'),
    notes: z.string().max(1000, 'Notas deve ter no máximo 1000 caracteres').optional(),
    paymentMethod: z.enum(PAYMENT_METHOD_SLUGS).optional(),
    creditCardId: z.string().optional(),
  })
  .refine((data) => data.paymentMethod !== 'CREDIT_CARD' || !!data.creditCardId, {
    message: 'Selecione um cartão de crédito',
    path: ['creditCardId'],
  })
  .refine(
    (data) => !data.paymentMethod || data.paymentMethod === 'CREDIT_CARD' || !data.creditCardId,
    {
      message: 'Cartão de crédito não se aplica a esta forma de pagamento',
      path: ['creditCardId'],
    },
  )

export type UpdateTransactionFormValues = z.infer<typeof updateTransactionSchema>
