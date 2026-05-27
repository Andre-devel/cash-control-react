export type CategoryType = 'INCOME' | 'EXPENSE'

export interface Category {
  id: string
  name: string
  color: string
  icon: string
  type: CategoryType
  parentId: string | null
  hidden: boolean
  archived: boolean
}

export interface ListCategoriesParams {
  includeHidden?: boolean
  includeArchived?: boolean
}

export interface CreateCategoryRequest {
  name: string
  color: string
  icon: string
  type: CategoryType
  parentId?: string
}

export type UpdateCategoryRequest = CreateCategoryRequest

export interface CategorizationRule {
  id: string
  pattern: string
  categoryId: string
  category: Category | null
  createdAt: string
}

export interface CreateCategorizationRuleRequest {
  pattern: string
  categoryId: string
}
