import { z } from 'zod'
import { moneyField } from '@/lib/money'

export const createTransferSchema = z
  .object({
    sourceAccountId: z.string().min(1, 'Conta de origem é obrigatória'),
    destinationAccountId: z.string().min(1, 'Conta de destino é obrigatória'),
    amount: moneyField('Valor deve ser um decimal válido (ex: 500,00)'),
    date: z.string().min(1, 'Data é obrigatória'),
    description: z.string().optional(),
  })
  .refine((data) => data.sourceAccountId !== data.destinationAccountId, {
    message: 'Conta de origem e destino devem ser diferentes',
    path: ['destinationAccountId'],
  })

export type CreateTransferFormValues = z.infer<typeof createTransferSchema>
