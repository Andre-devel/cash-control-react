import { z } from 'zod'
import { moneyField } from '@/lib/money'

export const ACCOUNT_TYPES = [
  'CHECKING',
  'SAVINGS',
  'CASH',
  'INVESTMENT',
  'CREDIT',
  'OTHER',
] as const

/** Moedas oferecidas no cadastro. A API aceita qualquer código ISO 4217 e recusa o resto. */
export const ACCOUNT_CURRENCIES = [
  { code: 'BRL', label: 'BRL — Real brasileiro' },
  { code: 'USD', label: 'USD — Dólar americano' },
  { code: 'EUR', label: 'EUR — Euro' },
] as const

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  type: z.enum(ACCOUNT_TYPES),
  currencyCode: z.enum(['BRL', 'USD', 'EUR'], { message: 'Escolha uma moeda da lista' }),
  initialBalance: moneyField('Saldo inicial deve ser um valor decimal válido (ex: 1500,00)'),
  description: z.string().optional(),
})

export type CreateAccountFormValues = z.infer<typeof createAccountSchema>
