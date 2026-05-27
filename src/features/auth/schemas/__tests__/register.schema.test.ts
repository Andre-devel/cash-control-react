import { describe, it, expect } from 'vitest'
import { registerSchema } from '../register.schema'

describe('registerSchema', () => {
  const validData = {
    name: 'Test User',
    email: 'user@example.com',
    password: 'securepass',
    confirmPassword: 'securepass',
  }

  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects password mismatch at schema level', () => {
    const result = registerSchema.safeParse({ ...validData, confirmPassword: 'different' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const mismatchIssue = result.error.issues.find((i) => i.path[0] === 'confirmPassword')
      expect(mismatchIssue?.message).toBe('Passwords do not match')
    }
  })

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: 'short',
      confirmPassword: 'short',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const passwordIssue = result.error.issues.find((i) => i.path[0] === 'password')
      expect(passwordIssue).toBeDefined()
    }
  })

  it('rejects invalid email format', () => {
    const result = registerSchema.safeParse({ ...validData, email: 'invalid' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const emailIssue = result.error.issues.find((i) => i.path[0] === 'email')
      expect(emailIssue).toBeDefined()
    }
  })

  it('rejects name shorter than 2 characters', () => {
    const result = registerSchema.safeParse({ ...validData, name: 'A' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameIssue = result.error.issues.find((i) => i.path[0] === 'name')
      expect(nameIssue).toBeDefined()
    }
  })

  it('rejects empty email', () => {
    const result = registerSchema.safeParse({ ...validData, email: '' })
    expect(result.success).toBe(false)
  })
})
