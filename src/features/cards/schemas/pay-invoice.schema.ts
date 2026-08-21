import { z } from 'zod'
import { moneyField } from '@/lib/money'

export function createPayInvoiceSchema(remainingAmount: string) {
  const remaining = parseFloat(remainingAmount)
  return z.object({
    amount: moneyField('Valor deve ser um decimal válido (ex: 100,00)')
      .refine(
        (val) => {
          const num = parseFloat(val)
          return !isNaN(num) && num > 0
        },
        { message: 'Valor deve ser maior que zero' },
      )
      .refine(
        (val) => {
          const num = parseFloat(val)
          return !isNaN(remaining) ? num <= remaining : true
        },
        { message: 'Valor não pode exceder o saldo restante' },
      ),
    sourceAccountId: z.string().min(1, 'Conta é obrigatória'),
    paymentDate: z.string().min(1, 'Data é obrigatória'),
  })
}

export const payInvoiceSchema = createPayInvoiceSchema('999999999.99')
export type PayInvoiceFormValues = z.infer<ReturnType<typeof createPayInvoiceSchema>>
