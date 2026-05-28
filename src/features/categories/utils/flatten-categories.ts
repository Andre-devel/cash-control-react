import type { Category } from '@/features/categories/types'

export function flattenCategories(categories: Category[]): Category[] {
  const result: Category[] = []
  for (const cat of categories) {
    result.push(cat)
    if (cat.subcategories && cat.subcategories.length > 0) {
      result.push(...flattenCategories(cat.subcategories))
    }
  }
  return result
}
