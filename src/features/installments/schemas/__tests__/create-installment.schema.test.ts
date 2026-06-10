import { describe, it, expect } from 'vitest'
import { createInstallmentSchema } from '../create-installment.schema'
import { PAYMENT_METHOD_SLUGS } from '@/features/transactions/types'

const VALID_INPUT = {
  description: 'New laptop',
  totalAmount: '3600.00',
  totalInstallments: 12,
  accountId: 'account-1',
  categoryId: 'cat-1',
  firstPaymentDate: '2026-06-01',
  paymentMethod: 'OTHER' as const,
}

describe('createInstallmentSchema', () => {
  it('accepts a valid installment series', () => {
    expect(createInstallmentSchema.safeParse(VALID_INPUT).success).toBe(true)
  })

  it('accepts installment without categoryId', () => {
    const { categoryId: _, ...rest } = VALID_INPUT
    expect(createInstallmentSchema.safeParse(rest).success).toBe(true)
  })

  it('rejects empty description', () => {
    const result = createInstallmentSchema.safeParse({ ...VALID_INPUT, description: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'description')).toBe(true)
    }
  })

  it('rejects description exceeding 255 characters', () => {
    const result = createInstallmentSchema.safeParse({
      ...VALID_INPUT,
      description: 'a'.repeat(256),
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-decimal totalAmount string', () => {
    const result = createInstallmentSchema.safeParse({ ...VALID_INPUT, totalAmount: 'abc' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'totalAmount')).toBe(true)
    }
  })

  it('rejects totalAmount with more than 2 decimal places', () => {
    const result = createInstallmentSchema.safeParse({ ...VALID_INPUT, totalAmount: '3600.123' })
    expect(result.success).toBe(false)
  })

  it('accepts totalAmount with two decimal places', () => {
    expect(
      createInstallmentSchema.safeParse({ ...VALID_INPUT, totalAmount: '3600.50' }).success,
    ).toBe(true)
  })

  it('accepts integer totalAmount string', () => {
    expect(createInstallmentSchema.safeParse({ ...VALID_INPUT, totalAmount: '3600' }).success).toBe(
      true,
    )
  })

  it('rejects totalInstallments less than 2', () => {
    const result = createInstallmentSchema.safeParse({ ...VALID_INPUT, totalInstallments: 1 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'totalInstallments')).toBe(true)
    }
  })

  it('rejects totalInstallments of 0', () => {
    const result = createInstallmentSchema.safeParse({ ...VALID_INPUT, totalInstallments: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects negative totalInstallments', () => {
    const result = createInstallmentSchema.safeParse({ ...VALID_INPUT, totalInstallments: -1 })
    expect(result.success).toBe(false)
  })

  it('accepts totalInstallments of 2 (minimum)', () => {
    expect(
      createInstallmentSchema.safeParse({ ...VALID_INPUT, totalInstallments: 2 }).success,
    ).toBe(true)
  })

  it('accepts totalInstallments of 24', () => {
    expect(
      createInstallmentSchema.safeParse({ ...VALID_INPUT, totalInstallments: 24 }).success,
    ).toBe(true)
  })

  it('rejects non-integer totalInstallments', () => {
    const result = createInstallmentSchema.safeParse({ ...VALID_INPUT, totalInstallments: 3.5 })
    expect(result.success).toBe(false)
  })

  it('rejects empty accountId', () => {
    const result = createInstallmentSchema.safeParse({ ...VALID_INPUT, accountId: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'accountId')).toBe(true)
    }
  })

  it('rejects empty firstPaymentDate', () => {
    const result = createInstallmentSchema.safeParse({ ...VALID_INPUT, firstPaymentDate: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing required fields', () => {
    expect(createInstallmentSchema.safeParse({}).success).toBe(false)
  })
})

describe('createInstallmentSchema — paymentMethod field', () => {
  it('rejects when paymentMethod is missing', () => {
    const { paymentMethod: _, ...rest } = VALID_INPUT
    expect(createInstallmentSchema.safeParse(rest).success).toBe(false)
  })

  it.each(PAYMENT_METHOD_SLUGS.filter((s) => s !== 'CREDIT_CARD'))(
    'accepts non-credit-card paymentMethod %s',
    (slug) => {
      expect(
        createInstallmentSchema.safeParse({ ...VALID_INPUT, paymentMethod: slug }).success,
      ).toBe(true)
    },
  )

  it('accepts CREDIT_CARD when creditCardId is provided', () => {
    expect(
      createInstallmentSchema.safeParse({
        ...VALID_INPUT,
        paymentMethod: 'CREDIT_CARD',
        creditCardId: 'card-uuid-1234',
      }).success,
    ).toBe(true)
  })

  it('rejects an invalid paymentMethod slug', () => {
    const result = createInstallmentSchema.safeParse({ ...VALID_INPUT, paymentMethod: 'WIRE' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'paymentMethod')).toBe(true)
    }
  })
})

describe('createInstallmentSchema — creditCardId refinement', () => {
  it('accepts CREDIT_CARD with a creditCardId', () => {
    expect(
      createInstallmentSchema.safeParse({
        ...VALID_INPUT,
        paymentMethod: 'CREDIT_CARD',
        creditCardId: 'card-uuid-1234',
      }).success,
    ).toBe(true)
  })

  it('rejects CREDIT_CARD without a creditCardId', () => {
    const result = createInstallmentSchema.safeParse({
      ...VALID_INPUT,
      paymentMethod: 'CREDIT_CARD',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'creditCardId')).toBe(true)
    }
  })

  it('rejects CREDIT_CARD with an empty creditCardId', () => {
    const result = createInstallmentSchema.safeParse({
      ...VALID_INPUT,
      paymentMethod: 'CREDIT_CARD',
      creditCardId: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'creditCardId')).toBe(true)
    }
  })

  it('accepts non-CREDIT_CARD without a creditCardId', () => {
    expect(
      createInstallmentSchema.safeParse({ ...VALID_INPUT, paymentMethod: 'PIX' }).success,
    ).toBe(true)
  })

  it('rejects non-CREDIT_CARD when creditCardId is provided', () => {
    const result = createInstallmentSchema.safeParse({
      ...VALID_INPUT,
      paymentMethod: 'PIX',
      creditCardId: 'card-uuid-1234',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'creditCardId')).toBe(true)
    }
  })

  it('accepts default OTHER without a creditCardId', () => {
    expect(createInstallmentSchema.safeParse(VALID_INPUT).success).toBe(true)
  })
})
