import { memo } from 'react'
import { Button } from '@/components/ui/button'
import type { Category } from '@/features/categories/types'

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
}

interface CategoryNodeProps {
  node: CategoryTreeNode
  depth?: number
  onEdit: (category: Category) => void
  onHide: (category: Category) => void
  onShow: (category: Category) => void
  onArchive: (category: Category) => void
  onUnarchive: (category: Category) => void
}

export const CategoryNode = memo(function CategoryNode({
  node,
  depth = 0,
  onEdit,
  onHide,
  onShow,
  onArchive,
  onUnarchive,
}: CategoryNodeProps) {
  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
        style={{ marginLeft: depth * 20 }}
      >
        <span
          className="inline-block w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: node.color }}
          aria-hidden="true"
        />
        <span className="flex-1 font-medium truncate">{node.name}</span>
        <span className="text-xs text-muted-foreground capitalize">{node.type.toLowerCase()}</span>

        {node.hidden && (
          <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
            Hidden
          </span>
        )}
        {node.archived && (
          <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
            Archived
          </span>
        )}

        <div className="flex gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs min-h-[44px] sm:min-h-0"
            onClick={() => onEdit(node)}
            aria-label={`Edit ${node.name}`}
          >
            Edit
          </Button>

          {node.hidden ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs min-h-[44px] sm:min-h-0"
              onClick={() => onShow(node)}
              aria-label={`Show ${node.name}`}
            >
              Show
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs min-h-[44px] sm:min-h-0"
              onClick={() => onHide(node)}
              aria-label={`Hide ${node.name}`}
            >
              Hide
            </Button>
          )}

          {node.archived ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs min-h-[44px] sm:min-h-0"
              onClick={() => onUnarchive(node)}
              aria-label={`Unarchive ${node.name}`}
            >
              Unarchive
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs min-h-[44px] sm:min-h-0"
              onClick={() => onArchive(node)}
              aria-label={`Archive ${node.name}`}
            >
              Archive
            </Button>
          )}
        </div>
      </div>

      {node.children.length > 0 && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <CategoryNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onEdit={onEdit}
              onHide={onHide}
              onShow={onShow}
              onArchive={onArchive}
              onUnarchive={onUnarchive}
            />
          ))}
        </div>
      )}
    </div>
  )
})
