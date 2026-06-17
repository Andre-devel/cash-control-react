export interface Category {
  id: string
  name: string
  color: string
  icon: string
  parentId: string | null
  parentName?: string | null
  sortOrder: number
  isDefault: boolean
  isHidden: boolean
  isArchived: boolean
  archivedAt?: string | null
  subcategories?: Category[]
  createdAt?: string
  updatedAt?: string
}

export interface ListCategoriesParams {
  includeHidden?: boolean
  includeArchived?: boolean
}

export interface CreateCategoryRequest {
  name: string
  color?: string
  icon?: string
  parentId?: string
  sortOrder?: number
}

export type UpdateCategoryRequest = CreateCategoryRequest

export interface CategorizationRule {
  id: string
  pattern: string
  categoryId: string
  subcategoryId?: string
  accountId?: string
  priority?: number
  category: Category | null
  createdAt: string
}

export interface CreateCategorizationRuleRequest {
  pattern: string
  categoryId: string
  subcategoryId?: string
  accountId?: string
  priority?: number
}
