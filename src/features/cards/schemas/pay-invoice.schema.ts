import { z } from 'zod'

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

export function createPayInvoiceSchema(remainingAmount: string) {
  const remaining = parseFloat(remainingAmount)
  return z.object({
    amount: z
      .string()
      .regex(DECIMAL_PATTERN, 'Valor deve ser um decimal válido (ex: 100.00)')
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
    accountId: z.string().min(1, 'Conta é obrigatória'),
  })
}

export const payInvoiceSchema = createPayInvoiceSchema('999999999.99')
export type PayInvoiceFormValues = z.infer<ReturnType<typeof createPayInvoiceSchema>>
