import { flattenCategories } from '@/features/categories/utils/flatten-categories'
import type { Category } from '@/features/categories/types'

export interface CategoryGroup {
  /** Categoria raiz — também é selecionável, não só um rótulo de seção. */
  root: Category
  children: Category[]
}

/**
 * Agrupa as categorias em raiz + subcategorias.
 *
 * Aceita tanto a árvore devolvida pela API (raízes com `subcategories`) quanto uma lista
 * já achatada: em ambos os casos quem manda é o `parentId`. Uma subcategoria cujo pai não
 * veio na lista (por filtro de ocultas/arquivadas) entra como raiz — some da tela seria
 * pior do que aparecer fora do lugar.
 */
export function buildCategoryGroups(categories: Category[]): CategoryGroup[] {
  const flat = flattenCategories(categories)
  const byId = new Map(flat.map((category) => [category.id, category]))
  const groups: CategoryGroup[] = []
  const byRootId = new Map<string, CategoryGroup>()

  function groupFor(root: Category): CategoryGroup {
    let group = byRootId.get(root.id)
    if (!group) {
      group = { root, children: [] }
      byRootId.set(root.id, group)
      groups.push(group)
    }
    return group
  }

  // Primeiro as raízes, para que a ordem dos grupos siga a ordem da lista recebida.
  for (const category of flat) {
    const parent = category.parentId ? byId.get(category.parentId) : undefined
    if (!parent) groupFor(category)
  }
  for (const category of flat) {
    const parent = category.parentId ? byId.get(category.parentId) : undefined
    if (parent) groupFor(parent).children.push(category)
  }

  return groups
}

/** Busca sem acento e sem caixa: "alimentacao" precisa achar "Alimentação". */
export function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Filtra os grupos pelo termo digitado. Uma raiz que casa mantém todos os filhos (quem
 * procura "Alimentação" quer ver o que tem dentro); um filho que casa traz a raiz junto,
 * senão a linha apareceria sem contexto.
 */
export function filterCategoryGroups(groups: CategoryGroup[], term: string): CategoryGroup[] {
  const query = normalizeForSearch(term)
  if (!query) return groups

  const matches = (category: Category) => normalizeForSearch(category.name).includes(query)

  const result: CategoryGroup[] = []
  for (const group of groups) {
    if (matches(group.root)) {
      result.push(group)
      continue
    }
    const children = group.children.filter(matches)
    if (children.length > 0) result.push({ root: group.root, children })
  }
  return result
}
