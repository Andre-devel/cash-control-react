import { axiosInstance } from '@/services/http'
import type {
  Category,
  ListCategoriesParams,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategorizationRule,
  CreateCategorizationRuleRequest,
} from '@/features/categories/types'

export async function listCategories(params?: ListCategoriesParams): Promise<Category[]> {
  const response = await axiosInstance.get<Category[]>('/categories', { params })
  return response.data
}

export async function createCategory(data: CreateCategoryRequest): Promise<Category> {
  const response = await axiosInstance.post<Category>('/categories', data)
  return response.data
}

export async function updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category> {
  const response = await axiosInstance.put<Category>(`/categories/${id}`, data)
  return response.data
}

export async function hideCategory(id: string): Promise<void> {
  await axiosInstance.post(`/categories/${id}/hide`)
}

export async function showCategory(id: string): Promise<void> {
  await axiosInstance.post(`/categories/${id}/show`)
}

export async function archiveCategory(id: string): Promise<void> {
  await axiosInstance.post(`/categories/${id}/archive`)
}

export async function unarchiveCategory(id: string): Promise<void> {
  await axiosInstance.post(`/categories/${id}/unarchive`)
}

export async function suggestCategory(description: string): Promise<Category | null> {
  const response = await axiosInstance.get<Category | null>('/categories/suggest', {
    params: { description },
  })
  return response.data
}

export async function listCategorizationRules(): Promise<CategorizationRule[]> {
  const response = await axiosInstance.get<CategorizationRule[]>('/categories/rules')
  return response.data
}

export async function createCategorizationRule(
  data: CreateCategorizationRuleRequest,
): Promise<CategorizationRule> {
  const response = await axiosInstance.post<CategorizationRule>('/categories/rules', data)
  return response.data
}

export async function deleteCategorizationRule(id: string): Promise<void> {
  await axiosInstance.delete(`/categories/rules/${id}`)
}
