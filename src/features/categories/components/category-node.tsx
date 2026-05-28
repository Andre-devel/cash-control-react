import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { IconBubble } from '@/components/ui/icon-bubble'
import { TypeBadge } from '@/components/ui/type-badge'
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
        <TypeBadge type={node.type} />
        {node.isSystem && (
          <Badge kind="muted" dot={false} square>
            Sistema
          </Badge>
        )}
        {node.hidden && (
          <Badge kind="muted" dot={false} square>
            Oculto
          </Badge>
        )}
        {node.archived && (
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
            disabled={node.isSystem}
          >
            Editar
          </Button>

          {node.hidden ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShow(node)}
              aria-label={`Show ${node.name}`}
              disabled={node.isSystem}
            >
              Mostrar
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onHide(node)}
              aria-label={`Hide ${node.name}`}
              disabled={node.isSystem}
            >
              Ocultar
            </Button>
          )}

          {node.archived ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUnarchive(node)}
              aria-label={`Unarchive ${node.name}`}
              disabled={node.isSystem}
            >
              Desarquivar
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onArchive(node)}
              aria-label={`Archive ${node.name}`}
              disabled={node.isSystem}
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
