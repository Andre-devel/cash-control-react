import { describe, it, expect } from 'vitest'
import { flattenCategories } from '../flatten-categories'
import type { Category } from '@/features/categories/types'

function makeCategory(overrides: Partial<Category> & { id: string; name: string }): Category {
  return {
    color: '#000',
    icon: 'tag',
    type: 'EXPENSE',
    parentId: null,
    hidden: false,
    archived: false,
    isSystem: false,
    ...overrides,
  }
}

const FOOD = makeCategory({ id: 'cat-1', name: 'Food' })
const RESTAURANT = makeCategory({ id: 'cat-3', name: 'Restaurant', parentId: 'cat-1' })
const SALARY = makeCategory({ id: 'cat-2', name: 'Salary', type: 'INCOME' })

describe('flattenCategories', () => {
  it('returns empty array for empty input', () => {
    expect(flattenCategories([])).toEqual([])
  })

  it('returns root-only categories unchanged', () => {
    const result = flattenCategories([FOOD, SALARY])
    expect(result).toHaveLength(2)
    expect(result.map((c) => c.id)).toEqual(['cat-1', 'cat-2'])
  })

  it('includes subcategories after their parent', () => {
    const foodWithSub: Category = { ...FOOD, subcategories: [RESTAURANT] }
    const result = flattenCategories([foodWithSub, SALARY])
    expect(result).toHaveLength(3)
    expect(result[0].id).toBe('cat-1')
    expect(result[1].id).toBe('cat-3')
    expect(result[2].id).toBe('cat-2')
  })

  it('flattens deeply nested subcategories', () => {
    const deepChild = makeCategory({ id: 'cat-deep', name: 'Deep', parentId: 'cat-3' })
    const restaurantWithDeep: Category = { ...RESTAURANT, subcategories: [deepChild] }
    const foodWithSub: Category = { ...FOOD, subcategories: [restaurantWithDeep] }
    const result = flattenCategories([foodWithSub])
    expect(result).toHaveLength(3)
    expect(result.map((c) => c.id)).toEqual(['cat-1', 'cat-3', 'cat-deep'])
  })

  it('handles categories without subcategories field', () => {
    const categoryWithoutSubcategories = makeCategory({ id: 'cat-x', name: 'X' })
    const result = flattenCategories([categoryWithoutSubcategories])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('cat-x')
  })

  it('handles categories with empty subcategories array', () => {
    const categoryWithEmptySubs: Category = { ...FOOD, subcategories: [] }
    const result = flattenCategories([categoryWithEmptySubs])
    expect(result).toHaveLength(1)
  })

  it('preserves all category fields', () => {
    const result = flattenCategories([FOOD])
    expect(result[0]).toMatchObject({
      id: 'cat-1',
      name: 'Food',
      isSystem: false,
    })
  })
})
