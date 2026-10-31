import { z } from 'zod'
import { moneyField } from '@/lib/money'

export const budgetSchema = z.object({
  categoryId: z.string().min(1, 'Escolha uma categoria'),
  amount: moneyField('Valor deve ser um decimal válido (ex: 1.200,00)', { positive: true }),
  scope: z.enum(['DEFAULT', 'MONTH']),
})

export type BudgetFormInput = z.input<typeof budgetSchema>
export type BudgetFormValues = z.output<typeof budgetSchema>
