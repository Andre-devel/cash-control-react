import { describe, it, expect } from 'vitest'
import { createCardSchema } from '../create-card.schema'

const VALID_INPUT = {
  name: 'Nubank',
  brand: 'VISA' as const,
  lastFourDigits: '1234',
  creditLimit: '5000.00',
  billingCycleDay: 1,
  dueDay: 10,
  color: '#820AD1',
}

describe('createCardSchema', () => {
  it('accepts a valid card', () => {
    expect(createCardSchema.safeParse(VALID_INPUT).success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = createCardSchema.safeParse({ ...VALID_INPUT, name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'name')).toBe(true)
    }
  })

  it('rejects invalid brand enum', () => {
    const result = createCardSchema.safeParse({ ...VALID_INPUT, brand: 'INVALID' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'brand')).toBe(true)
    }
  })

  it.each(['VISA', 'MASTERCARD', 'ELO', 'AMEX', 'HIPERCARD', 'OTHER'])(
    'accepts brand %s',
    (brand) => {
      expect(createCardSchema.safeParse({ ...VALID_INPUT, brand }).success).toBe(true)
    },
  )

  it('rejects lastFourDigits with less than 4 digits', () => {
    const result = createCardSchema.safeParse({ ...VALID_INPUT, lastFourDigits: '123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'lastFourDigits')).toBe(true)
    }
  })

  it('rejects lastFourDigits with more than 4 digits', () => {
    const result = createCardSchema.safeParse({ ...VALID_INPUT, lastFourDigits: '12345' })
    expect(result.success).toBe(false)
  })

  it('rejects non-numeric lastFourDigits', () => {
    const result = createCardSchema.safeParse({ ...VALID_INPUT, lastFourDigits: '12ab' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'lastFourDigits')).toBe(true)
    }
  })

  it('accepts exactly 4 numeric digits', () => {
    expect(createCardSchema.safeParse({ ...VALID_INPUT, lastFourDigits: '0000' }).success).toBe(
      true,
    )
  })

  it('rejects non-decimal creditLimit', () => {
    const result = createCardSchema.safeParse({ ...VALID_INPUT, creditLimit: 'abc' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'creditLimit')).toBe(true)
    }
  })

  it('rejects creditLimit with more than 2 decimal places', () => {
    const result = createCardSchema.safeParse({ ...VALID_INPUT, creditLimit: '5000.123' })
    expect(result.success).toBe(false)
  })

  it('rejects billingCycleDay below 1', () => {
    const result = createCardSchema.safeParse({ ...VALID_INPUT, billingCycleDay: 0 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'billingCycleDay')).toBe(true)
    }
  })

  it('rejects billingCycleDay above 31', () => {
    const result = createCardSchema.safeParse({ ...VALID_INPUT, billingCycleDay: 32 })
    expect(result.success).toBe(false)
  })

  it('accepts billingCycleDay 1', () => {
    expect(createCardSchema.safeParse({ ...VALID_INPUT, billingCycleDay: 1 }).success).toBe(true)
  })

  it('accepts billingCycleDay 31', () => {
    expect(createCardSchema.safeParse({ ...VALID_INPUT, billingCycleDay: 31 }).success).toBe(true)
  })

  it('rejects dueDay below 1', () => {
    const result = createCardSchema.safeParse({ ...VALID_INPUT, dueDay: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects dueDay above 31', () => {
    const result = createCardSchema.safeParse({ ...VALID_INPUT, dueDay: 32 })
    expect(result.success).toBe(false)
  })

  it('rejects missing required fields', () => {
    expect(createCardSchema.safeParse({}).success).toBe(false)
  })
})
