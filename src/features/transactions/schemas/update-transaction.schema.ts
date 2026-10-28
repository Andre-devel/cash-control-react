import { z } from 'zod'
import { PAYMENT_METHOD_SLUGS } from '@/features/transactions/types'
import { moneyField } from '@/lib/money'

export const updateTransactionSchema = z
  .object({
    description: z
      .string()
      .min(1, 'Descrição é obrigatória')
      .max(255, 'Descrição deve ter no máximo 255 caracteres'),
    amount: moneyField('Valor deve ser um número decimal válido (ex: 150,75)', { positive: true }),
    categoryId: z.string().optional(),
    competenceDate: z.string().min(1, 'Data é obrigatória'),
    /** A API só aceita avançar: Pendente/Vencida → Pago. Cancelar tem ação própria. */
    status: z.enum(['PENDING', 'OVERDUE', 'PAID']).optional(),
    paymentDate: z.string().optional(),
    notes: z.string().max(5000, 'Notas deve ter no máximo 5000 caracteres').optional(),
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
