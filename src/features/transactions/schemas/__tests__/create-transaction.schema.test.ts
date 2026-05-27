import { describe, it, expect } from 'vitest'
import {
  createTransactionSchema,
  TRANSACTION_TYPES,
  TRANSACTION_STATUSES,
} from '../create-transaction.schema'

const VALID_INPUT = {
  description: 'Supermarket',
  amount: '150.75',
  type: 'EXPENSE' as const,
  accountId: 'account-1',
  categoryId: 'cat-1',
  competenceDate: '2026-05-01',
  status: 'PAID' as const,
}

describe('createTransactionSchema', () => {
  it('accepts a valid transaction', () => {
    expect(createTransactionSchema.safeParse(VALID_INPUT).success).toBe(true)
  })

  it('accepts transaction without categoryId', () => {
    const { categoryId: _, ...rest } = VALID_INPUT
    expect(createTransactionSchema.safeParse(rest).success).toBe(true)
  })

  it('rejects empty description', () => {
    const result = createTransactionSchema.safeParse({ ...VALID_INPUT, description: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'description')).toBe(true)
    }
  })

  it('rejects description exceeding 255 characters', () => {
    const result = createTransactionSchema.safeParse({
      ...VALID_INPUT,
      description: 'a'.repeat(256),
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-decimal amount string', () => {
    const result = createTransactionSchema.safeParse({ ...VALID_INPUT, amount: 'abc' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'amount')).toBe(true)
    }
  })

  it('rejects amount with more than 2 decimal places', () => {
    const result = createTransactionSchema.safeParse({ ...VALID_INPUT, amount: '150.123' })
    expect(result.success).toBe(false)
  })

  it('accepts integer amount string', () => {
    expect(createTransactionSchema.safeParse({ ...VALID_INPUT, amount: '150' }).success).toBe(true)
  })

  it('accepts amount with two decimal places', () => {
    expect(createTransactionSchema.safeParse({ ...VALID_INPUT, amount: '150.75' }).success).toBe(
      true,
    )
  })

  it('rejects invalid transaction type enum', () => {
    const result = createTransactionSchema.safeParse({ ...VALID_INPUT, type: 'TRANSFER' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'type')).toBe(true)
    }
  })

  it.each(TRANSACTION_TYPES)('accepts type %s', (type) => {
    expect(createTransactionSchema.safeParse({ ...VALID_INPUT, type }).success).toBe(true)
  })

  it('rejects empty accountId', () => {
    const result = createTransactionSchema.safeParse({ ...VALID_INPUT, accountId: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'accountId')).toBe(true)
    }
  })

  it('rejects empty competenceDate', () => {
    const result = createTransactionSchema.safeParse({ ...VALID_INPUT, competenceDate: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid status enum', () => {
    const result = createTransactionSchema.safeParse({ ...VALID_INPUT, status: 'UNKNOWN' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'status')).toBe(true)
    }
  })

  it.each(TRANSACTION_STATUSES)('accepts status %s', (status) => {
    expect(createTransactionSchema.safeParse({ ...VALID_INPUT, status }).success).toBe(true)
  })

  it('rejects missing required fields', () => {
    expect(createTransactionSchema.safeParse({}).success).toBe(false)
  })
})
