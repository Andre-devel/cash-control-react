import { memo, useMemo } from 'react'
import { CategoryNode, type CategoryTreeNode } from './category-node'
import type { Category } from '@/features/categories/types'

function buildTree(categories: Category[]): CategoryTreeNode[] {
  function toNode(cat: Category): CategoryTreeNode {
    return {
      ...cat,
      children: (cat.subcategories ?? []).map(toNode),
    }
  }
  return categories.map(toNode)
}

interface CategoryTreeProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onHide: (category: Category) => void
  onShow: (category: Category) => void
  onArchive: (category: Category) => void
  onUnarchive: (category: Category) => void
}

export const CategoryTree = memo(function CategoryTree({
  categories,
  onEdit,
  onHide,
  onShow,
  onArchive,
  onUnarchive,
}: CategoryTreeProps) {
  const tree = useMemo(() => buildTree(categories), [categories])

  return (
    <div role="tree" aria-label="Category tree">
      {tree.map((node) => (
        <CategoryNode
          key={node.id}
          node={node}
          onEdit={onEdit}
          onHide={onHide}
          onShow={onShow}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
        />
      ))}
    </div>
  )
})
