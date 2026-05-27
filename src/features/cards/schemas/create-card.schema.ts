import { z } from 'zod'

export const CARD_BRANDS = ['VISA', 'MASTERCARD', 'ELO', 'AMEX', 'HIPERCARD', 'OTHER'] as const

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/
const FOUR_DIGITS_PATTERN = /^\d{4}$/

export const createCardSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  brand: z.enum(CARD_BRANDS, { message: 'Brand is required' }),
  lastFourDigits: z
    .string()
    .regex(FOUR_DIGITS_PATTERN, 'Last four digits must be exactly 4 numeric characters'),
  creditLimit: z
    .string()
    .regex(DECIMAL_PATTERN, 'Credit limit must be a valid decimal amount (e.g. 5000.00)'),
  billingCycleDay: z
    .number()
    .int('Billing cycle day must be an integer')
    .min(1, 'Billing cycle day must be between 1 and 31')
    .max(31, 'Billing cycle day must be between 1 and 31'),
  dueDay: z
    .number()
    .int('Due day must be an integer')
    .min(1, 'Due day must be between 1 and 31')
    .max(31, 'Due day must be between 1 and 31'),
  color: z.string().min(1, 'Color is required'),
})

export type CreateCardFormValues = z.infer<typeof createCardSchema>
