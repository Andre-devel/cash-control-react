import { describe, it, expect } from 'vitest'
import { resetPasswordSchema } from '../reset-password.schema'

describe('resetPasswordSchema', () => {
  it('accepts valid matching passwords', () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects passwords shorter than 8 characters', () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: 'short',
      confirmPassword: 'short',
    })
    expect(result.success).toBe(false)
  })

  it('rejects mismatching passwords', () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: 'newpass123',
      confirmPassword: 'different123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issues = result.error.issues
      const confirmError = issues.find((e) => e.path.includes('confirmPassword'))
      expect(confirmError).toBeDefined()
    }
  })

  it('rejects empty confirmPassword', () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: 'newpass123',
      confirmPassword: '',
    })
    expect(result.success).toBe(false)
  })
})
