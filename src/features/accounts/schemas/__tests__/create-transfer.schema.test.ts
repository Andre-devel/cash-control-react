import { describe, it, expect } from 'vitest'
import { createTransferSchema } from '../create-transfer.schema'

const VALID_INPUT = {
  sourceAccountId: 'account-1',
  destinationAccountId: 'account-2',
  amount: '500.00',
  date: '2026-05-27',
  description: 'Monthly savings',
}

describe('createTransferSchema', () => {
  it('accepts a valid transfer', () => {
    expect(createTransferSchema.safeParse(VALID_INPUT).success).toBe(true)
  })

  it('rejects same-account transfer', () => {
    const result = createTransferSchema.safeParse({
      ...VALID_INPUT,
      sourceAccountId: 'account-1',
      destinationAccountId: 'account-1',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('destinationAccountId'))).toBe(true)
    }
  })

  it('rejects non-decimal amount', () => {
    const result = createTransferSchema.safeParse({ ...VALID_INPUT, amount: 'abc' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'amount')).toBe(true)
    }
  })

  it('rejects float amount with too many decimal places', () => {
    const result = createTransferSchema.safeParse({ ...VALID_INPUT, amount: '500.123' })
    expect(result.success).toBe(false)
  })

  it('accepts amount with one decimal place', () => {
    expect(createTransferSchema.safeParse({ ...VALID_INPUT, amount: '500.5' }).success).toBe(true)
  })

  it('accepts amount with two decimal places', () => {
    expect(createTransferSchema.safeParse({ ...VALID_INPUT, amount: '500.50' }).success).toBe(true)
  })

  it('accepts amount without decimal places', () => {
    expect(createTransferSchema.safeParse({ ...VALID_INPUT, amount: '500' }).success).toBe(true)
  })

  it('rejects empty sourceAccountId', () => {
    const result = createTransferSchema.safeParse({ ...VALID_INPUT, sourceAccountId: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty destinationAccountId', () => {
    const result = createTransferSchema.safeParse({ ...VALID_INPUT, destinationAccountId: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty date', () => {
    const result = createTransferSchema.safeParse({ ...VALID_INPUT, date: '' })
    expect(result.success).toBe(false)
  })

  it('accepts transfer without description', () => {
    const { description: _, ...withoutDescription } = VALID_INPUT
    expect(createTransferSchema.safeParse(withoutDescription).success).toBe(true)
  })
})
