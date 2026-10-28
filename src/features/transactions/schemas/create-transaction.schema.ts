import { z } from 'zod'
import { PAYMENT_METHOD_SLUGS } from '@/features/transactions/types'
import { moneyField } from '@/lib/money'

export const TRANSACTION_TYPES = ['INCOME', 'EXPENSE', 'REFUND'] as const
/** Cancelar é uma ação sobre uma transação existente, não um status de cadastro. */
export const TRANSACTION_STATUSES = ['PAID', 'PENDING'] as const

/** VENCIDA é atribuída pelo job noturno, nunca escolhida na criação — mas é filtrável. */
export const TRANSACTION_FILTER_STATUSES = ['PENDING', 'OVERDUE', 'PAID', 'CANCELLED'] as const

export const createTransactionSchema = z
  .object({
    description: z
      .string()
      .min(1, 'Descrição é obrigatória')
      .max(255, 'Descrição deve ter no máximo 255 caracteres'),
    amount: moneyField('Valor deve ser um número decimal válido (ex: 150,75)', { positive: true }),
    type: z.enum(TRANSACTION_TYPES),
    accountId: z.string().min(1, 'Conta é obrigatória'),
    categoryId: z.string().optional(),
    competenceDate: z.string().min(1, 'Data é obrigatória'),
    status: z.enum(TRANSACTION_STATUSES),
    /** Só com status Pago; vazio usa a data de competência. */
    paymentDate: z.string().optional(),
    notes: z.string().max(5000, 'Notas deve ter no máximo 5000 caracteres').optional(),
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
