import { describe, it, expect } from 'vitest'
import { createAccountSchema } from '../create-account.schema'

const VALID_INPUT = {
  name: 'Nubank',
  type: 'CHECKING' as const,
  currency: 'BRL',
  initialBalance: '1500.00',
  color: '#820AD1',
  icon: 'wallet',
}

describe('createAccountSchema', () => {
  it('accepts a valid account', () => {
    expect(createAccountSchema.safeParse(VALID_INPUT).success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = createAccountSchema.safeParse({ ...VALID_INPUT, name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'name')).toBe(true)
    }
  })

  it('rejects name exceeding 100 characters', () => {
    const result = createAccountSchema.safeParse({ ...VALID_INPUT, name: 'a'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('rejects invalid account type enum', () => {
    const result = createAccountSchema.safeParse({ ...VALID_INPUT, type: 'INVALID_TYPE' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'type')).toBe(true)
    }
  })

  it.each(['CHECKING', 'SAVINGS', 'CASH', 'INVESTMENT', 'CREDIT', 'OTHER'])(
    'accepts type %s',
    (type) => {
      expect(createAccountSchema.safeParse({ ...VALID_INPUT, type }).success).toBe(true)
    },
  )

  it('rejects non-decimal initialBalance', () => {
    const result = createAccountSchema.safeParse({ ...VALID_INPUT, initialBalance: 'abc' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'initialBalance')).toBe(true)
    }
  })

  it('rejects initialBalance with too many decimal places', () => {
    const result = createAccountSchema.safeParse({ ...VALID_INPUT, initialBalance: '1500.123' })
    expect(result.success).toBe(false)
  })

  it('accepts integer initialBalance string', () => {
    expect(createAccountSchema.safeParse({ ...VALID_INPUT, initialBalance: '1500' }).success).toBe(
      true,
    )
  })

  it('accepts initialBalance with two decimal places', () => {
    expect(
      createAccountSchema.safeParse({ ...VALID_INPUT, initialBalance: '1500.50' }).success,
    ).toBe(true)
  })

  it('accepts zero initialBalance', () => {
    expect(createAccountSchema.safeParse({ ...VALID_INPUT, initialBalance: '0.00' }).success).toBe(
      true,
    )
  })

  it('rejects empty color', () => {
    const result = createAccountSchema.safeParse({ ...VALID_INPUT, color: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty icon', () => {
    const result = createAccountSchema.safeParse({ ...VALID_INPUT, icon: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty currency', () => {
    const result = createAccountSchema.safeParse({ ...VALID_INPUT, currency: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing required fields', () => {
    expect(createAccountSchema.safeParse({}).success).toBe(false)
  })

  it('accepts optional description', () => {
    expect(
      createAccountSchema.safeParse({ ...VALID_INPUT, description: 'My main account' }).success,
    ).toBe(true)
  })

  it('accepts without description', () => {
    expect(createAccountSchema.safeParse(VALID_INPUT).success).toBe(true)
  })
})
