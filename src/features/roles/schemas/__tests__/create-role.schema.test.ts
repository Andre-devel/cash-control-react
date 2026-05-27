import { describe, it, expect } from 'vitest'
import { createRoleSchema } from '../create-role.schema'

describe('createRoleSchema', () => {
  it('accepts a valid name and description', () => {
    const result = createRoleSchema.safeParse({
      name: 'moderator',
      description: 'A moderator role',
    })
    expect(result.success).toBe(true)
  })

  it('normalizes name to uppercase', () => {
    const result = createRoleSchema.safeParse({ name: 'moderator' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('MODERATOR')
    }
  })

  it('rejects empty name', () => {
    const result = createRoleSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects name under 2 characters', () => {
    const result = createRoleSchema.safeParse({ name: 'A' })
    expect(result.success).toBe(false)
  })

  it('accepts name of exactly 2 characters', () => {
    const result = createRoleSchema.safeParse({ name: 'AB' })
    expect(result.success).toBe(true)
  })

  it('rejects name over 50 characters', () => {
    const result = createRoleSchema.safeParse({ name: 'A'.repeat(51) })
    expect(result.success).toBe(false)
  })

  it('accepts name of exactly 50 characters', () => {
    const result = createRoleSchema.safeParse({ name: 'A'.repeat(50) })
    expect(result.success).toBe(true)
  })

  it('allows omitting description', () => {
    const result = createRoleSchema.safeParse({ name: 'ADMIN' })
    expect(result.success).toBe(true)
  })

  it('allows empty description', () => {
    const result = createRoleSchema.safeParse({ name: 'ADMIN', description: '' })
    expect(result.success).toBe(true)
  })

  it('rejects description over 255 characters', () => {
    const result = createRoleSchema.safeParse({ name: 'ADMIN', description: 'A'.repeat(256) })
    expect(result.success).toBe(false)
  })

  it('accepts description of exactly 255 characters', () => {
    const result = createRoleSchema.safeParse({ name: 'ADMIN', description: 'A'.repeat(255) })
    expect(result.success).toBe(true)
  })
})
