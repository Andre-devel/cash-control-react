import { z } from 'zod'
import { moneyField } from '@/lib/money'

export const CARD_BRANDS = ['VISA', 'MASTERCARD', 'ELO', 'AMEX', 'HIPERCARD', 'OTHER'] as const

export const createCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  brand: z.enum(CARD_BRANDS, { message: 'Bandeira é obrigatória' }),
  issuer: z.string().max(100).optional(),
  // Opcional, mas é o que permite o import da fatura em PDF casar a seção
  // "CARTÃO ****XXXX" com este cartão. A string vazia é aceita porque é o que o
  // campo devolve quando o usuário não preenche — `cards.api` a converte em undefined.
  last4Digits: z
    .string()
    .regex(/^\d{4}$/, 'Informe exatamente 4 dígitos')
    .optional()
    .or(z.literal('')),
  creditLimit: moneyField('Limite deve ser um valor decimal válido (ex: 5000,00)'),
  closingDay: z
    .number()
    .int('Dia de fechamento deve ser um número inteiro')
    .min(1, 'Dia de fechamento deve estar entre 1 e 28')
    .max(28, 'Dia de fechamento deve estar entre 1 e 28'),
  dueDay: z
    .number()
    .int('Dia de vencimento deve ser um número inteiro')
    .min(1, 'Dia de vencimento deve estar entre 1 e 28')
    .max(28, 'Dia de vencimento deve estar entre 1 e 28'),
})

export type CreateCardFormValues = z.infer<typeof createCardSchema>
