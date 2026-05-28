import { describe, it, expect } from 'vitest'
import { forgotPasswordSchema } from '../forgot-password.schema'

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'user@example.com' }).success).toBe(true)
  })

  it('rejects empty email', () => {
    const result = forgotPasswordSchema.safeParse({ email: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email format', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'not-an-email' })
    expect(result.success).toBe(false)
  })
})
