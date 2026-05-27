import { describe, it, expect } from 'vitest'
import { updateRoleSchema } from '../update-role.schema'

describe('updateRoleSchema', () => {
  it('accepts a valid description', () => {
    const result = updateRoleSchema.safeParse({ description: 'Updated description' })
    expect(result.success).toBe(true)
  })

  it('allows omitting description', () => {
    const result = updateRoleSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('allows empty description', () => {
    const result = updateRoleSchema.safeParse({ description: '' })
    expect(result.success).toBe(true)
  })

  it('rejects description over 255 characters', () => {
    const result = updateRoleSchema.safeParse({ description: 'A'.repeat(256) })
    expect(result.success).toBe(false)
  })

  it('accepts description of exactly 255 characters', () => {
    const result = updateRoleSchema.safeParse({ description: 'A'.repeat(255) })
    expect(result.success).toBe(true)
  })
})
