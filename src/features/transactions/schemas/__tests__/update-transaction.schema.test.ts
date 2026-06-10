import { describe, it, expect } from 'vitest'
import { updateTransactionSchema } from '../update-transaction.schema'
import { PAYMENT_METHOD_SLUGS } from '@/features/transactions/types'

const VALID_INPUT = {
  description: 'Supermarket',
  amount: '150.75',
  categoryId: 'cat-1',
  competenceDate: '2026-05-01',
  notes: 'Some notes',
}

describe('updateTransactionSchema', () => {
  it('accepts a valid update', () => {
    expect(updateTransactionSchema.safeParse(VALID_INPUT).success).toBe(true)
  })

  it('accepts update without optional fields', () => {
    const { categoryId: _, notes: __, ...rest } = VALID_INPUT
    expect(updateTransactionSchema.safeParse(rest).success).toBe(true)
  })

  it('rejects empty description', () => {
    const result = updateTransactionSchema.safeParse({ ...VALID_INPUT, description: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'description')).toBe(true)
    }
  })

  it('rejects description exceeding 255 characters', () => {
    const result = updateTransactionSchema.safeParse({
      ...VALID_INPUT,
      description: 'a'.repeat(256),
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-decimal amount string', () => {
    const result = updateTransactionSchema.safeParse({ ...VALID_INPUT, amount: 'abc' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'amount')).toBe(true)
    }
  })

  it('rejects amount with more than 2 decimal places', () => {
    const result = updateTransactionSchema.safeParse({ ...VALID_INPUT, amount: '150.123' })
    expect(result.success).toBe(false)
  })

  it('accepts integer amount string', () => {
    expect(updateTransactionSchema.safeParse({ ...VALID_INPUT, amount: '150' }).success).toBe(true)
  })

  it('rejects empty competenceDate', () => {
    const result = updateTransactionSchema.safeParse({ ...VALID_INPUT, competenceDate: '' })
    expect(result.success).toBe(false)
  })

  it('rejects notes exceeding 1000 characters', () => {
    const result = updateTransactionSchema.safeParse({ ...VALID_INPUT, notes: 'a'.repeat(1001) })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'notes')).toBe(true)
    }
  })

  it('rejects missing required fields', () => {
    expect(updateTransactionSchema.safeParse({}).success).toBe(false)
  })
})

describe('updateTransactionSchema — paymentMethod field', () => {
  it('accepts update without paymentMethod', () => {
    expect(updateTransactionSchema.safeParse(VALID_INPUT).success).toBe(true)
  })

  it.each(PAYMENT_METHOD_SLUGS.filter((s) => s !== 'CREDIT_CARD'))(
    'accepts non-credit-card paymentMethod %s',
    (slug) => {
      expect(
        updateTransactionSchema.safeParse({ ...VALID_INPUT, paymentMethod: slug }).success,
      ).toBe(true)
    },
  )

  it('accepts CREDIT_CARD when creditCardId is provided', () => {
    expect(
      updateTransactionSchema.safeParse({
        ...VALID_INPUT,
        paymentMethod: 'CREDIT_CARD',
        creditCardId: 'card-uuid-1234',
      }).success,
    ).toBe(true)
  })

  it('rejects an invalid paymentMethod slug', () => {
    const result = updateTransactionSchema.safeParse({ ...VALID_INPUT, paymentMethod: 'WIRE' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'paymentMethod')).toBe(true)
    }
  })
})

describe('updateTransactionSchema — creditCardId refinement', () => {
  it('accepts CREDIT_CARD with a creditCardId', () => {
    expect(
      updateTransactionSchema.safeParse({
        ...VALID_INPUT,
        paymentMethod: 'CREDIT_CARD',
        creditCardId: 'card-uuid-1234',
      }).success,
    ).toBe(true)
  })

  it('rejects CREDIT_CARD without a creditCardId', () => {
    const result = updateTransactionSchema.safeParse({
      ...VALID_INPUT,
      paymentMethod: 'CREDIT_CARD',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'creditCardId')).toBe(true)
    }
  })

  it('rejects CREDIT_CARD with an empty creditCardId', () => {
    const result = updateTransactionSchema.safeParse({
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
      updateTransactionSchema.safeParse({ ...VALID_INPUT, paymentMethod: 'PIX' }).success,
    ).toBe(true)
  })

  it('rejects non-CREDIT_CARD when creditCardId is provided', () => {
    const result = updateTransactionSchema.safeParse({
      ...VALID_INPUT,
      paymentMethod: 'CASH',
      creditCardId: 'card-uuid-1234',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'creditCardId')).toBe(true)
    }
  })

  it('accepts undefined paymentMethod with creditCardId absent', () => {
    expect(updateTransactionSchema.safeParse(VALID_INPUT).success).toBe(true)
  })
})
