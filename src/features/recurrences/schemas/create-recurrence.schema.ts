import { z } from 'zod'

export const RECURRENCE_FREQUENCIES = ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY'] as const

export const RECURRENCE_TYPES = ['INCOME', 'EXPENSE', 'REFUND'] as const

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

export const createRecurrenceSchema = z.object({
  description: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),
  amount: z.string().regex(DECIMAL_PATTERN, 'Valor deve ser um decimal válido (ex: 150.00)'),
  frequency: z.enum(RECURRENCE_FREQUENCIES, { message: 'Frequência é obrigatória' }),
  type: z.enum(RECURRENCE_TYPES, { message: 'Tipo é obrigatório' }),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  categoryId: z.string().optional(),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().optional(),
})

export type CreateRecurrenceFormValues = z.infer<typeof createRecurrenceSchema>
