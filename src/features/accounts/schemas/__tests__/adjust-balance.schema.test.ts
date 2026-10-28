import { describe, it, expect } from 'vitest'
import { adjustBalanceSchema, adjustmentDelta } from '../adjust-balance.schema'

describe('adjustmentDelta', () => {
  it('is the difference between the target and the current balance', () => {
    expect(adjustmentDelta('6997.90', '7000.00')).toBe('2.10')
    expect(adjustmentDelta('100.00', '-50.00')).toBe('-150.00')
    expect(adjustmentDelta('0.1', '0.3')).toBe('0.20')
    expect(adjustmentDelta('10.00', '10')).toBe('0.00')
  })
})

describe('adjustBalanceSchema', () => {
  it('accepts a pt-BR target balance, negative included', () => {
    expect(adjustBalanceSchema.parse({ targetBalance: '-1.250,40' }).targetBalance).toBe('-1250.40')
  })
})
