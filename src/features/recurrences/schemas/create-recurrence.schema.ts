import { z } from 'zod'
import { moneyField } from '@/lib/money'

export const RECURRENCE_FREQUENCIES = ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY'] as const

export const RECURRENCE_TYPES = ['INCOME', 'EXPENSE', 'REFUND'] as const

export const FREQUENCY_LABELS: Record<(typeof RECURRENCE_FREQUENCIES)[number], string> = {
  DAILY: 'Diária',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quinzenal',
  MONTHLY: 'Mensal',
  YEARLY: 'Anual',
}

export const createRecurrenceSchema = z
  .object({
    description: z
      .string()
      .min(1, 'Descrição é obrigatória')
      .max(255, 'Descrição deve ter no máximo 255 caracteres'),
    amount: moneyField('Valor deve ser um decimal válido (ex: 150,00)', { positive: true }),
    frequency: z.enum(RECURRENCE_FREQUENCIES, { message: 'Frequência é obrigatória' }),
    type: z.enum(RECURRENCE_TYPES, { message: 'Tipo é obrigatório' }),
    accountId: z.string().min(1, 'Conta é obrigatória'),
    categoryId: z.string().optional(),
    startDate: z.string().min(1, 'Data de início é obrigatória'),
    endDate: z.string().optional(),
    paymentMethod: z.string().optional(),
    creditCardId: z.string().optional(),
  })
  .refine((data) => !data.endDate || !data.startDate || data.endDate >= data.startDate, {
    message: 'A data de fim não pode ser anterior à data de início',
    path: ['endDate'],
  })
  .refine((data) => data.paymentMethod !== 'CREDIT_CARD' || !!data.creditCardId, {
    message: 'Selecione o cartão',
    path: ['creditCardId'],
  })
  .refine((data) => data.paymentMethod !== 'CREDIT_CARD' || data.type !== 'INCOME', {
    message: 'Receitas não podem ser lançadas no cartão',
    path: ['paymentMethod'],
  })

export type CreateRecurrenceFormValues = z.infer<typeof createRecurrenceSchema>
