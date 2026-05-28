import { describe, it, expect } from 'vitest'
import { createRecurrenceSchema } from '../create-recurrence.schema'

const VALID_INPUT = {
  description: 'Monthly rent',
  amount: '1500.00',
  frequency: 'MONTHLY' as const,
  type: 'EXPENSE' as const,
  accountId: 'account-uuid-1234',
  startDate: '2026-01-01',
}

describe('createRecurrenceSchema', () => {
  it('accepts a valid recurrence', () => {
    expect(createRecurrenceSchema.safeParse(VALID_INPUT).success).toBe(true)
  })

  it('accepts valid recurrence with optional categoryId', () => {
    expect(
      createRecurrenceSchema.safeParse({ ...VALID_INPUT, categoryId: 'category-uuid' }).success,
    ).toBe(true)
  })

  it('rejects empty description', () => {
    const result = createRecurrenceSchema.safeParse({ ...VALID_INPUT, description: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'description')).toBe(true)
    }
  })

  it('rejects description exceeding 255 characters', () => {
    const result = createRecurrenceSchema.safeParse({
      ...VALID_INPUT,
      description: 'a'.repeat(256),
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-decimal amount', () => {
    const result = createRecurrenceSchema.safeParse({ ...VALID_INPUT, amount: 'abc' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'amount')).toBe(true)
    }
  })

  it('rejects amount with more than 2 decimal places', () => {
    const result = createRecurrenceSchema.safeParse({ ...VALID_INPUT, amount: '1500.123' })
    expect(result.success).toBe(false)
  })

  it('accepts amount with two decimal places', () => {
    expect(createRecurrenceSchema.safeParse({ ...VALID_INPUT, amount: '1500.50' }).success).toBe(
      true,
    )
  })

  it('accepts integer amount string', () => {
    expect(createRecurrenceSchema.safeParse({ ...VALID_INPUT, amount: '1500' }).success).toBe(true)
  })

  it('accepts zero amount', () => {
    expect(createRecurrenceSchema.safeParse({ ...VALID_INPUT, amount: '0.00' }).success).toBe(true)
  })

  it('rejects invalid frequency enum', () => {
    const result = createRecurrenceSchema.safeParse({ ...VALID_INPUT, frequency: 'INVALID' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'frequency')).toBe(true)
    }
  })

  it.each(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'])(
    'accepts frequency %s',
    (frequency) => {
      expect(createRecurrenceSchema.safeParse({ ...VALID_INPUT, frequency }).success).toBe(true)
    },
  )

  it('rejects invalid type enum', () => {
    const result = createRecurrenceSchema.safeParse({ ...VALID_INPUT, type: 'INVALID_TYPE' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'type')).toBe(true)
    }
  })

  it.each(['INCOME', 'EXPENSE', 'REFUND'])('accepts type %s', (type) => {
    expect(createRecurrenceSchema.safeParse({ ...VALID_INPUT, type }).success).toBe(true)
  })

  it('rejects ADJUSTMENT type (not a valid recurrence type)', () => {
    const result = createRecurrenceSchema.safeParse({ ...VALID_INPUT, type: 'ADJUSTMENT' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'type')).toBe(true)
    }
  })

  it('rejects empty accountId', () => {
    const result = createRecurrenceSchema.safeParse({ ...VALID_INPUT, accountId: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'accountId')).toBe(true)
    }
  })

  it('rejects empty startDate', () => {
    const result = createRecurrenceSchema.safeParse({ ...VALID_INPUT, startDate: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'startDate')).toBe(true)
    }
  })

  it('rejects missing required fields', () => {
    expect(createRecurrenceSchema.safeParse({}).success).toBe(false)
  })
})
