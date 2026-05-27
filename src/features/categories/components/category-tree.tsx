import { useMemo } from 'react'
import { CategoryNode, type CategoryTreeNode } from './category-node'
import type { Category } from '@/features/categories/types'

function buildTree(categories: Category[]): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>()
  const roots: CategoryTreeNode[] = []

  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] })
  })

  map.forEach((node) => {
    if (node.parentId !== null && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

interface CategoryTreeProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onHide: (category: Category) => void
  onShow: (category: Category) => void
  onArchive: (category: Category) => void
  onUnarchive: (category: Category) => void
}

export function CategoryTree({
  categories,
  onEdit,
  onHide,
  onShow,
  onArchive,
  onUnarchive,
}: CategoryTreeProps) {
  const tree = useMemo(() => buildTree(categories), [categories])

  return (
    <div className="space-y-1" role="tree" aria-label="Category tree">
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
}
