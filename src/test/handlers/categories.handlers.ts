import { http, HttpResponse } from 'msw'
import type { Category, CategorizationRule } from '@/features/categories/types'

export const MOCK_CATEGORY_FOOD: Category = {
  id: 'cat-1',
  name: 'Food',
  color: '#4CAF50',
  icon: 'utensils',
  type: 'EXPENSE',
  parentId: null,
  hidden: false,
  archived: false,
  isSystem: false,
}

export const MOCK_CATEGORY_SALARY: Category = {
  id: 'cat-2',
  name: 'Salary',
  color: '#2196F3',
  icon: 'briefcase',
  type: 'INCOME',
  parentId: null,
  hidden: false,
  archived: false,
  isSystem: false,
}

export const MOCK_CATEGORY_RESTAURANT: Category = {
  id: 'cat-3',
  name: 'Restaurant',
  color: '#FF9800',
  icon: 'fork-knife',
  type: 'EXPENSE',
  parentId: 'cat-1',
  hidden: false,
  archived: false,
  isSystem: false,
}

export const MOCK_CATEGORY_HIDDEN: Category = {
  id: 'cat-4',
  name: 'Hidden Category',
  color: '#9E9E9E',
  icon: 'eye-off',
  type: 'EXPENSE',
  parentId: null,
  hidden: true,
  archived: false,
  isSystem: false,
}

export const MOCK_CATEGORY_ARCHIVED: Category = {
  id: 'cat-5',
  name: 'Archived Category',
  color: '#795548',
  icon: 'archive',
  type: 'EXPENSE',
  parentId: null,
  hidden: false,
  archived: true,
  isSystem: false,
}

export const MOCK_CATEGORY_SYSTEM: Category = {
  id: 'cat-sys-1',
  name: 'System Category',
  color: '#607D8B',
  icon: 'lock',
  type: 'EXPENSE',
  parentId: null,
  hidden: false,
  archived: false,
  isSystem: true,
}

export const MOCK_RULE_1: CategorizationRule = {
  id: 'rule-1',
  pattern: 'Supermarket',
  categoryId: 'cat-1',
  category: MOCK_CATEGORY_FOOD,
  priority: 1,
  createdAt: '2026-01-01T00:00:00Z',
}

let categoriesStore: Category[] = [
  MOCK_CATEGORY_FOOD,
  MOCK_CATEGORY_SALARY,
  MOCK_CATEGORY_RESTAURANT,
  MOCK_CATEGORY_HIDDEN,
  MOCK_CATEGORY_ARCHIVED,
  MOCK_CATEGORY_SYSTEM,
]

let rulesStore: CategorizationRule[] = [MOCK_RULE_1]

export function resetCategoriesStore() {
  categoriesStore = [
    MOCK_CATEGORY_FOOD,
    MOCK_CATEGORY_SALARY,
    MOCK_CATEGORY_RESTAURANT,
    MOCK_CATEGORY_HIDDEN,
    MOCK_CATEGORY_ARCHIVED,
    MOCK_CATEGORY_SYSTEM,
  ]
  rulesStore = [MOCK_RULE_1]
}

function buildNestedResponse(
  flat: Category[],
  options: { includeHidden: boolean; includeArchived: boolean },
): Category[] {
  let filtered = flat
  if (!options.includeHidden) filtered = filtered.filter((c) => !c.hidden)
  if (!options.includeArchived) filtered = filtered.filter((c) => !c.archived)

  const roots = filtered.filter((c) => c.parentId === null)
  return roots.map((root) => ({
    ...root,
    subcategories: filtered.filter((c) => c.parentId === root.id),
  }))
}

export const categoriesHandlers = [
  http.get('*/categories/suggest', ({ request }) => {
    const url = new URL(request.url)
    const description = url.searchParams.get('description') ?? ''
    const found = categoriesStore.find(
      (c) => !c.archived && description.toLowerCase().includes(c.name.toLowerCase()),
    )
    return HttpResponse.json(found ?? null)
  }),

  http.get('*/categories/rules', () => {
    return HttpResponse.json(rulesStore)
  }),

  http.post('*/categories/rules', async ({ request }) => {
    const body = (await request.json()) as {
      pattern: string
      categoryId: string
      subcategoryId?: string
      accountId?: string
    }
    const category = categoriesStore.find((c) => c.id === body.categoryId) ?? null
    const created: CategorizationRule = {
      id: `rule-${Date.now()}`,
      pattern: body.pattern,
      categoryId: body.categoryId,
      subcategoryId: body.subcategoryId,
      accountId: body.accountId,
      priority: rulesStore.length + 1,
      category,
      createdAt: new Date().toISOString(),
    }
    rulesStore = [...rulesStore, created]
    return HttpResponse.json(created, { status: 201 })
  }),

  http.delete('*/categories/rules/:id', ({ params }) => {
    rulesStore = rulesStore.filter((r) => r.id !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('*/categories', ({ request }) => {
    const url = new URL(request.url)
    const includeHidden = url.searchParams.get('includeHidden') === 'true'
    const includeArchived = url.searchParams.get('includeArchived') === 'true'

    return HttpResponse.json(
      buildNestedResponse(categoriesStore, { includeHidden, includeArchived }),
    )
  }),

  http.post('*/categories', async ({ request }) => {
    const body = (await request.json()) as Omit<Category, 'id' | 'hidden' | 'archived' | 'isSystem'>
    const created: Category = {
      ...body,
      id: `cat-${Date.now()}`,
      hidden: false,
      archived: false,
      isSystem: false,
      parentId: (body as Category).parentId ?? null,
    }
    categoriesStore = [...categoriesStore, created]
    return HttpResponse.json(created, { status: 201 })
  }),

  http.put('*/categories/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<Category>
    categoriesStore = categoriesStore.map((c) => (c.id === params.id ? { ...c, ...body } : c))
    const updated = categoriesStore.find((c) => c.id === params.id)
    return HttpResponse.json(updated)
  }),

  http.post('*/categories/:id/hide', ({ params }) => {
    categoriesStore = categoriesStore.map((c) => (c.id === params.id ? { ...c, hidden: true } : c))
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/categories/:id/show', ({ params }) => {
    categoriesStore = categoriesStore.map((c) => (c.id === params.id ? { ...c, hidden: false } : c))
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/categories/:id/archive', ({ params }) => {
    categoriesStore = categoriesStore.map((c) =>
      c.id === params.id ? { ...c, archived: true } : c,
    )
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/categories/:id/unarchive', ({ params }) => {
    categoriesStore = categoriesStore.map((c) =>
      c.id === params.id ? { ...c, archived: false } : c,
    )
    return new HttpResponse(null, { status: 204 })
  }),
]
