import { describe, it, expect } from 'vitest'
import { transactionFiltersSchema } from '../transaction-filters.schema'

describe('transactionFiltersSchema', () => {
  it('accepts an empty filter object', () => {
    expect(transactionFiltersSchema.safeParse({}).success).toBe(true)
  })

  it('accepts all optional filters set', () => {
    expect(
      transactionFiltersSchema.safeParse({
        accountId: 'account-1',
        type: 'EXPENSE',
        status: 'PAID',
        categoryId: 'cat-1',
        competenceDateFrom: '2026-01-01',
        competenceDateTo: '2026-12-31',
        paymentDateFrom: '2026-01-01',
        paymentDateTo: '2026-12-31',
        amountMin: '10.00',
        amountMax: '1000.00',
        searchText: 'market',
        includeCancelled: true,
        page: 0,
        size: 20,
        sort: 'competenceDate,desc',
      }).success,
    ).toBe(true)
  })

  it('accepts partial filters', () => {
    expect(
      transactionFiltersSchema.safeParse({
        type: 'INCOME',
        page: 2,
      }).success,
    ).toBe(true)
  })

  it('accepts empty string for amountMin and amountMax', () => {
    expect(
      transactionFiltersSchema.safeParse({
        amountMin: '',
        amountMax: '',
      }).success,
    ).toBe(true)
  })

  it('rejects invalid decimal for amountMin', () => {
    const result = transactionFiltersSchema.safeParse({ amountMin: 'abc' })
    expect(result.success).toBe(false)
  })

  it('accepts TRANSFER type for filtering', () => {
    expect(transactionFiltersSchema.safeParse({ type: 'TRANSFER' }).success).toBe(true)
  })

  it('rejects invalid transaction type enum', () => {
    const result = transactionFiltersSchema.safeParse({ type: 'ADJUSTMENT' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid status enum', () => {
    const result = transactionFiltersSchema.safeParse({ status: 'UNKNOWN' })
    expect(result.success).toBe(false)
  })

  it('accepts includeCancelled as boolean', () => {
    expect(transactionFiltersSchema.safeParse({ includeCancelled: false }).success).toBe(true)
  })

  it('accepts page = 0', () => {
    expect(transactionFiltersSchema.safeParse({ page: 0 }).success).toBe(true)
  })
})
