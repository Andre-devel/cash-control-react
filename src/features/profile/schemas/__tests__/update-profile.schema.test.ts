import { describe, it, expect } from 'vitest'
import { updateProfileSchema } from '../update-profile.schema'

describe('updateProfileSchema', () => {
  it('accepts a valid name', () => {
    const result = updateProfileSchema.safeParse({ name: 'John Doe' })
    expect(result.success).toBe(true)
  })

  it('rejects an empty name', () => {
    const result = updateProfileSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameIssue = result.error.issues.find((i) => i.path[0] === 'name')
      expect(nameIssue?.message).toBe('Name is required')
    }
  })

  it('rejects a name exceeding 100 characters', () => {
    const result = updateProfileSchema.safeParse({ name: 'a'.repeat(101) })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameIssue = result.error.issues.find((i) => i.path[0] === 'name')
      expect(nameIssue?.message).toBe('Name must be at most 100 characters')
    }
  })

  it('accepts a name of exactly 100 characters', () => {
    const result = updateProfileSchema.safeParse({ name: 'a'.repeat(100) })
    expect(result.success).toBe(true)
  })

  it('rejects missing name field', () => {
    const result = updateProfileSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
