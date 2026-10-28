import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { IconBubble } from '@/components/ui/icon-bubble'
import { Badge } from '@/components/ui/badge'
import { resolveCategoryIcon } from '@/features/categories/utils/category-icon'
import type { Category } from '@/features/categories/types'

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
}

interface CategoryNodeProps {
  node: CategoryTreeNode
  depth?: number
  /** A categoria pai está oculta: esta some dos seletores junto com ela. */
  parentHidden?: boolean
  onEdit: (category: Category) => void
  onHide: (category: Category) => void
  onShow: (category: Category) => void
  onArchive: (category: Category) => void
  onUnarchive: (category: Category) => void
}

export const CategoryNode = memo(function CategoryNode({
  node,
  depth = 0,
  parentHidden = false,
  onEdit,
  onHide,
  onShow,
  onArchive,
  onUnarchive,
}: CategoryNodeProps) {
  return (
    <div>
      <div className="list-row category-row">
        {depth > 0 && (
          <span style={{ width: depth * 20, flexShrink: 0, display: 'inline-block' }} />
        )}
        <IconBubble color={node.color} size="sm" {...resolveCategoryIcon(node.icon)} />
        <div className="category-row-name">
          <div className="fw-500 truncate">{node.name}</div>
        </div>
        {node.isDefault && (
          <span title="Categoria do sistema: não pode ser editada nem arquivada, mas pode ser ocultada.">
            <Badge kind="muted" dot={false} square>
              Sistema
            </Badge>
          </span>
        )}
        {node.isHidden ? (
          <Badge kind="muted" dot={false} square>
            Oculta
          </Badge>
        ) : (
          parentHidden && (
            <Badge kind="muted" dot={false} square>
              Oculta pela categoria pai
            </Badge>
          )
        )}
        {node.isArchived && (
          <Badge kind="muted" dot={false} square>
            Arquivada
          </Badge>
        )}
        <div className="category-row-actions">
          {!node.isDefault && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(node)}
              aria-label={`Editar ${node.name}`}
            >
              Editar
            </Button>
          )}

          {node.isHidden ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShow(node)}
              aria-label={`Mostrar ${node.name}`}
            >
              Mostrar
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onHide(node)}
              aria-label={`Ocultar ${node.name}`}
            >
              Ocultar
            </Button>
          )}

          {!node.isDefault &&
            (node.isArchived ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUnarchive(node)}
                aria-label={`Desarquivar ${node.name}`}
              >
                Desarquivar
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onArchive(node)}
                aria-label={`Arquivar ${node.name}`}
              >
                Arquivar
              </Button>
            ))}
        </div>
      </div>

      {node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <CategoryNode
              key={child.id}
              node={child}
              depth={depth + 1}
              parentHidden={parentHidden || node.isHidden}
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
