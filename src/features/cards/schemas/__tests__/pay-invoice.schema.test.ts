import { describe, it, expect } from 'vitest'
import { createPayInvoiceSchema } from '../pay-invoice.schema'

describe('createPayInvoiceSchema', () => {
  const schema = createPayInvoiceSchema('500.00')
  const paymentDate = '2026-08-20'

  it('accepts a valid full payment', () => {
    expect(
      schema.safeParse({ amount: '500.00', sourceAccountId: 'account-1', paymentDate }).success,
    ).toBe(true)
  })

  it('accepts a valid partial payment', () => {
    expect(
      schema.safeParse({ amount: '100.00', sourceAccountId: 'account-1', paymentDate }).success,
    ).toBe(true)
  })

  it('rejects amount exceeding remaining balance', () => {
    const result = schema.safeParse({
      amount: '600.00',
      sourceAccountId: 'account-1',
      paymentDate,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('não pode exceder'))).toBe(true)
    }
  })

  it('rejects zero amount', () => {
    const result = schema.safeParse({ amount: '0.00', sourceAccountId: 'account-1', paymentDate })
    expect(result.success).toBe(false)
  })

  it('rejects non-decimal amount', () => {
    const result = schema.safeParse({ amount: 'abc', sourceAccountId: 'account-1', paymentDate })
    expect(result.success).toBe(false)
  })

  it('rejects empty sourceAccountId', () => {
    const result = schema.safeParse({ amount: '100.00', sourceAccountId: '', paymentDate })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'sourceAccountId')).toBe(true)
    }
  })

  it('rejects empty paymentDate', () => {
    const result = schema.safeParse({
      amount: '100.00',
      sourceAccountId: 'account-1',
      paymentDate: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'paymentDate')).toBe(true)
    }
  })

  it('accepts amount equal to remaining', () => {
    expect(
      schema.safeParse({ amount: '500.00', sourceAccountId: 'account-1', paymentDate }).success,
    ).toBe(true)
  })
})
