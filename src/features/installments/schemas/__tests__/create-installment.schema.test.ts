import { describe, it, expect } from 'vitest'
import { createInstallmentSchema, INSTALLMENT_TYPES } from '../create-installment.schema'

const VALID_INPUT = {
  description: 'New laptop',
  totalAmount: '3600.00',
  installmentCount: 12,
  accountId: 'account-1',
  categoryId: 'cat-1',
  firstDueDate: '2026-06-01',
  type: 'EXPENSE' as const,
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

  it('rejects installmentCount less than 2', () => {
    const result = createInstallmentSchema.safeParse({ ...VALID_INPUT, installmentCount: 1 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'installmentCount')).toBe(true)
    }
  })

  it('rejects installmentCount of 0', () => {
    const result = createInstallmentSchema.safeParse({ ...VALID_INPUT, installmentCount: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects negative installmentCount', () => {
    const result = createInstallmentSchema.safeParse({ ...VALID_INPUT, installmentCount: -1 })
    expect(result.success).toBe(false)
  })

  it('accepts installmentCount of 2 (minimum)', () => {
    expect(createInstallmentSchema.safeParse({ ...VALID_INPUT, installmentCount: 2 }).success).toBe(
      true,
    )
  })

  it('accepts installmentCount of 24', () => {
    expect(
      createInstallmentSchema.safeParse({ ...VALID_INPUT, installmentCount: 24 }).success,
    ).toBe(true)
  })

  it('rejects non-integer installmentCount', () => {
    const result = createInstallmentSchema.safeParse({ ...VALID_INPUT, installmentCount: 3.5 })
    expect(result.success).toBe(false)
  })

  it('rejects empty accountId', () => {
    const result = createInstallmentSchema.safeParse({ ...VALID_INPUT, accountId: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'accountId')).toBe(true)
    }
  })

  it('rejects empty firstDueDate', () => {
    const result = createInstallmentSchema.safeParse({ ...VALID_INPUT, firstDueDate: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid type enum', () => {
    const result = createInstallmentSchema.safeParse({ ...VALID_INPUT, type: 'ADJUSTMENT' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'type')).toBe(true)
    }
  })

  it.each(INSTALLMENT_TYPES)('accepts type %s', (type) => {
    expect(createInstallmentSchema.safeParse({ ...VALID_INPUT, type }).success).toBe(true)
  })

  it('rejects missing required fields', () => {
    expect(createInstallmentSchema.safeParse({}).success).toBe(false)
  })
})
