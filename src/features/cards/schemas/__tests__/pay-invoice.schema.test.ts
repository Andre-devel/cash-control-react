import { describe, it, expect } from 'vitest'
import { createPayInvoiceSchema } from '../pay-invoice.schema'

describe('createPayInvoiceSchema', () => {
  const schema = createPayInvoiceSchema('500.00')

  it('accepts a valid full payment', () => {
    expect(schema.safeParse({ amount: '500.00', accountId: 'account-1' }).success).toBe(true)
  })

  it('accepts a valid partial payment', () => {
    expect(schema.safeParse({ amount: '100.00', accountId: 'account-1' }).success).toBe(true)
  })

  it('rejects amount exceeding remaining balance', () => {
    const result = schema.safeParse({ amount: '600.00', accountId: 'account-1' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('cannot exceed'))).toBe(true)
    }
  })

  it('rejects zero amount', () => {
    const result = schema.safeParse({ amount: '0.00', accountId: 'account-1' })
    expect(result.success).toBe(false)
  })

  it('rejects non-decimal amount', () => {
    const result = schema.safeParse({ amount: 'abc', accountId: 'account-1' })
    expect(result.success).toBe(false)
  })

  it('rejects empty accountId', () => {
    const result = schema.safeParse({ amount: '100.00', accountId: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'accountId')).toBe(true)
    }
  })

  it('accepts amount equal to remaining', () => {
    expect(schema.safeParse({ amount: '500.00', accountId: 'account-1' }).success).toBe(true)
  })
})
