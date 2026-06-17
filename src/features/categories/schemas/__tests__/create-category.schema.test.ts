import { describe, it, expect } from 'vitest'
import { createCategorySchema } from '../create-category.schema'

const VALID_INPUT = {
  name: 'Food',
  color: '#4CAF50',
  icon: 'tag',
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

  it('accepts category without color', () => {
    const { color: _, ...rest } = VALID_INPUT
    expect(createCategorySchema.safeParse(rest).success).toBe(true)
  })

  it('accepts category without icon', () => {
    const { icon: _, ...rest } = VALID_INPUT
    expect(createCategorySchema.safeParse(rest).success).toBe(true)
  })

  it('accepts empty color string', () => {
    expect(createCategorySchema.safeParse({ ...VALID_INPUT, color: '' }).success).toBe(true)
  })

  it('accepts empty icon string', () => {
    expect(createCategorySchema.safeParse({ ...VALID_INPUT, icon: '' }).success).toBe(true)
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

  it('rejects invalid hex color format', () => {
    const result = createCategorySchema.safeParse({ ...VALID_INPUT, color: 'notacolor' })
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
