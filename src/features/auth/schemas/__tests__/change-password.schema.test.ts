import { describe, it, expect } from 'vitest'
import { changePasswordSchema } from '../change-password.schema'

describe('changePasswordSchema', () => {
  it('accepts valid input with matching new passwords', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'current123',
      newPassword: 'newpass456',
      confirmPassword: 'newpass456',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty currentPassword', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: '',
      newPassword: 'newpass456',
      confirmPassword: 'newpass456',
    })
    expect(result.success).toBe(false)
  })

  it('rejects new password shorter than 8 characters', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'current123',
      newPassword: 'short',
      confirmPassword: 'short',
    })
    expect(result.success).toBe(false)
  })

  it('rejects mismatching new passwords', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'current123',
      newPassword: 'newpass456',
      confirmPassword: 'different789',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issues = result.error.issues
      const confirmError = issues.find((e) => e.path.includes('confirmPassword'))
      expect(confirmError).toBeDefined()
    }
  })
})
