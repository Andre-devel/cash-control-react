import { z } from 'zod'
import { moneyField } from '@/lib/money'

export const goalSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Use até 100 caracteres'),
  targetAmount: moneyField('Valor deve ser um decimal válido (ex: 20.000,00)', { positive: true }),
  targetDate: z.string(),
  /** `''`, `account:<id>` ou `holding:<id>`: um select só garante no máximo um vínculo. */
  link: z.string(),
  icon: z.string(),
  color: z.string(),
})

export type GoalFormInput = z.input<typeof goalSchema>
export type GoalFormValues = z.output<typeof goalSchema>
