import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { IconBubble } from '@/components/ui/icon-bubble'
import { Badge } from '@/components/ui/badge'
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
      <div className="list-row">
        {depth > 0 && (
          <span style={{ width: depth * 20, flexShrink: 0, display: 'inline-block' }} />
        )}
        <IconBubble color={node.color} glyph={node.icon} size="sm" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="fw-500 truncate">{node.name}</div>
        </div>
        {node.isDefault && (
          <Badge kind="muted" dot={false} square>
            Sistema
          </Badge>
        )}
        {node.isHidden && (
          <Badge kind="muted" dot={false} square>
            Oculto
          </Badge>
        )}
        {node.isArchived && (
          <Badge kind="muted" dot={false} square>
            Arquivado
          </Badge>
        )}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(node)}
            aria-label={`Edit ${node.name}`}
            disabled={node.isDefault}
          >
            Editar
          </Button>

          {node.isHidden ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShow(node)}
              aria-label={`Show ${node.name}`}
              disabled={node.isDefault}
            >
              Mostrar
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onHide(node)}
              aria-label={`Hide ${node.name}`}
              disabled={node.isDefault}
            >
              Ocultar
            </Button>
          )}

          {node.isArchived ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUnarchive(node)}
              aria-label={`Unarchive ${node.name}`}
              disabled={node.isDefault}
            >
              Desarquivar
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onArchive(node)}
              aria-label={`Archive ${node.name}`}
              disabled={node.isDefault}
            >
              Arquivar
            </Button>
          )}
        </div>
      </div>

      {node.children.length > 0 && (
        <div>
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
