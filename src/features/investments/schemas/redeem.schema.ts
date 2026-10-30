import { z } from 'zod'
import { moneyField } from '@/lib/money'

export const redeemSchema = z
  .object({
    date: z.string().min(1, 'Data é obrigatória'),
    mode: z.enum(['TOTAL', 'PARTIAL']),
    grossAmount: z.string(),
    destination: z.string(),
    netAmount: z.string(),
  })
  .superRefine((data, ctx) => {
    const money = moneyField('Valor deve ser um decimal válido (ex: 500,00)', { positive: true })
    if (data.mode === 'PARTIAL') {
      const parsed = money.safeParse(data.grossAmount)
      if (!parsed.success) {
        ctx.addIssue({
          code: 'custom',
          path: ['grossAmount'],
          message: parsed.error.issues[0].message,
        })
      }
    }
    if (data.netAmount) {
      const parsed = money.safeParse(data.netAmount)
      if (!parsed.success) {
        ctx.addIssue({
          code: 'custom',
          path: ['netAmount'],
          message: parsed.error.issues[0].message,
        })
      }
    }
  })

export type RedeemFormValues = z.infer<typeof redeemSchema>

export const manualValueSchema = z.object({
  value: moneyField('Valor deve ser um decimal válido (ex: 1.052,37)', { positive: true }),
  date: z.string().min(1, 'Data é obrigatória'),
})

export type ManualValueFormInput = z.input<typeof manualValueSchema>
export type ManualValueFormValues = z.output<typeof manualValueSchema>
