import { z } from 'zod'
import { PAYMENT_METHOD_SLUGS } from '@/features/transactions/types'

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

export const createInstallmentSchema = z
  .object({
    description: z
      .string()
      .min(1, 'Descrição é obrigatória')
      .max(255, 'Descrição deve ter no máximo 255 caracteres'),
    totalAmount: z
      .string()
      .regex(DECIMAL_PATTERN, 'Valor total deve ser um decimal válido (ex: 3600.00)'),
    totalInstallments: z
      .number()
      .int('Número de parcelas deve ser um número inteiro')
      .min(2, 'Número de parcelas deve ser pelo menos 2'),
    accountId: z.string().min(1, 'Conta é obrigatória'),
    categoryId: z.string().optional(),
    firstPaymentDate: z.string().min(1, 'Data do primeiro pagamento é obrigatória'),
    paymentMethod: z.enum(PAYMENT_METHOD_SLUGS),
    creditCardId: z.string().optional(),
  })
  .refine((data) => data.paymentMethod !== 'CREDIT_CARD' || !!data.creditCardId, {
    message: 'Selecione um cartão de crédito',
    path: ['creditCardId'],
  })
  .refine((data) => data.paymentMethod === 'CREDIT_CARD' || !data.creditCardId, {
    message: 'Cartão de crédito não se aplica a esta forma de pagamento',
    path: ['creditCardId'],
  })

export type CreateInstallmentFormValues = z.infer<typeof createInstallmentSchema>
