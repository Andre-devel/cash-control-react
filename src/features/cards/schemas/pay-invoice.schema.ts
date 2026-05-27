import { z } from 'zod'

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

export function createPayInvoiceSchema(remainingAmount: string) {
  const remaining = parseFloat(remainingAmount)
  return z.object({
    amount: z
      .string()
      .regex(DECIMAL_PATTERN, 'Amount must be a valid decimal amount (e.g. 100.00)')
      .refine(
        (val) => {
          const num = parseFloat(val)
          return !isNaN(num) && num > 0
        },
        { message: 'Amount must be greater than zero' },
      )
      .refine(
        (val) => {
          const num = parseFloat(val)
          return !isNaN(remaining) ? num <= remaining : true
        },
        { message: 'Amount cannot exceed the remaining balance' },
      ),
    accountId: z.string().min(1, 'Account is required'),
  })
}

export const payInvoiceSchema = createPayInvoiceSchema('999999999.99')
export type PayInvoiceFormValues = z.infer<ReturnType<typeof createPayInvoiceSchema>>
