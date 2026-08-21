import { z } from 'zod'
import { moneyField } from '@/lib/money'

/** O comprovante compartilhado é sempre um pagamento — PIX enviado ou recebido. */
export const RECEIPT_TYPES = ['EXPENSE', 'INCOME'] as const

export const receiptReviewSchema = z.object({
  accountId: z.string().min(1, 'Conta é obrigatória'),
  type: z.enum(RECEIPT_TYPES),
  amount: moneyField('Valor deve ser um número decimal válido (ex: 150,75)'),
  description: z
    .string()
    .min(1, 'Descrição é obrigatória')
    .max(255, 'Descrição deve ter no máximo 255 caracteres'),
  competenceDate: z.string().min(1, 'Data é obrigatória'),
  categoryId: z.string().optional(),
})

export type ReceiptReviewFormValues = z.infer<typeof receiptReviewSchema>
