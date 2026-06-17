import { describe, it, expect } from 'vitest'
import { createCardSchema } from '../create-card.schema'

const VALID_INPUT = {
  name: 'Nubank',
  brand: 'VISA' as const,
  creditLimit: '5000.00',
  closingDay: 1,
  dueDay: 10,
}

describe('createCardSchema', () => {
  it('accepts a valid card', () => {
    expect(createCardSchema.safeParse(VALID_INPUT).success).toBe(true)
  })

  it('accepts optional issuer field', () => {
    expect(
      createCardSchema.safeParse({ ...VALID_INPUT, issuer: 'Nu Pagamentos S.A.' }).success,
    ).toBe(true)
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

  it('rejects closingDay below 1', () => {
    const result = createCardSchema.safeParse({ ...VALID_INPUT, closingDay: 0 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'closingDay')).toBe(true)
    }
  })

  it('rejects closingDay above 28', () => {
    const result = createCardSchema.safeParse({ ...VALID_INPUT, closingDay: 29 })
    expect(result.success).toBe(false)
  })

  it('accepts closingDay 1', () => {
    expect(createCardSchema.safeParse({ ...VALID_INPUT, closingDay: 1 }).success).toBe(true)
  })

  it('accepts closingDay 28', () => {
    expect(createCardSchema.safeParse({ ...VALID_INPUT, closingDay: 28 }).success).toBe(true)
  })

  it('rejects dueDay below 1', () => {
    const result = createCardSchema.safeParse({ ...VALID_INPUT, dueDay: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects dueDay above 28', () => {
    const result = createCardSchema.safeParse({ ...VALID_INPUT, dueDay: 29 })
    expect(result.success).toBe(false)
  })

  it('rejects missing required fields', () => {
    expect(createCardSchema.safeParse({}).success).toBe(false)
  })
})
