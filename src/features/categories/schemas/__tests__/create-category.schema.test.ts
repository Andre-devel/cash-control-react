import { describe, it, expect } from 'vitest'
import { createCategorySchema } from '../create-category.schema'

const VALID_INPUT = {
  name: 'Food',
  color: '#4CAF50',
  icon: 'tag',
  type: 'EXPENSE' as const,
}

describe('createCategorySchema', () => {
  it('accepts a valid category', () => {
    expect(createCategorySchema.safeParse(VALID_INPUT).success).toBe(true)
  })

  it('accepts a valid category with parentId', () => {
    expect(createCategorySchema.safeParse({ ...VALID_INPUT, parentId: 'some-uuid' }).success).toBe(
      true,
    )
  })

  it('accepts a valid INCOME category', () => {
    expect(createCategorySchema.safeParse({ ...VALID_INPUT, type: 'INCOME' }).success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = createCategorySchema.safeParse({ ...VALID_INPUT, name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'name')).toBe(true)
    }
  })

  it('rejects name exceeding 100 characters', () => {
    const result = createCategorySchema.safeParse({ ...VALID_INPUT, name: 'a'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('rejects invalid type enum', () => {
    const result = createCategorySchema.safeParse({ ...VALID_INPUT, type: 'INVALID_TYPE' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'type')).toBe(true)
    }
  })

  it.each(['INCOME', 'EXPENSE'])('accepts type %s', (type) => {
    expect(createCategorySchema.safeParse({ ...VALID_INPUT, type }).success).toBe(true)
  })

  it('rejects empty color', () => {
    const result = createCategorySchema.safeParse({ ...VALID_INPUT, color: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty icon', () => {
    const result = createCategorySchema.safeParse({ ...VALID_INPUT, icon: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing required fields', () => {
    expect(createCategorySchema.safeParse({}).success).toBe(false)
  })

  it('parentId is optional and omitting it passes', () => {
    const { parentId: _, ...withoutParent } = { ...VALID_INPUT, parentId: undefined }
    expect(createCategorySchema.safeParse(withoutParent).success).toBe(true)
  })
})
