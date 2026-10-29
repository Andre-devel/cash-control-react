import { memo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { ActionMenu, type ActionMenuItem } from '@/components/ui/action-menu'
import { CategoryBubble } from './category-bubble'
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

function Tag({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex items-center rounded-xs bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium leading-none text-fg-muted"
    >
      {children}
    </span>
  )
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
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children.length > 0
  const childrenId = `cat-children-${node.id}`

  const items: ActionMenuItem[] = [
    ...(node.isDefault ? [] : [{ label: 'Editar', onSelect: () => onEdit(node) }]),
    node.isHidden
      ? { label: 'Mostrar', onSelect: () => onShow(node) }
      : { label: 'Ocultar', onSelect: () => onHide(node) },
    ...(node.isDefault
      ? []
      : [
          node.isArchived
            ? { label: 'Desarquivar', onSelect: () => onUnarchive(node) }
            : { label: 'Arquivar', onSelect: () => onArchive(node) },
        ]),
  ]

  const meta =
    depth === 0 && hasChildren
      ? `${node.children.length} ${node.children.length === 1 ? 'subcategoria' : 'subcategorias'}`
      : null

  return (
    <li className="list-none">
      <div
        className={`flex min-h-[56px] items-center gap-3 rounded-md py-1 pr-1 ${
          hasChildren ? 'cursor-pointer hover:bg-surface-2' : ''
        } ${node.isArchived || node.isHidden || parentHidden ? 'opacity-70' : ''}`}
        style={{ paddingLeft: depth * 28 + 4 }}
        onClick={hasChildren ? () => setExpanded((v) => !v) : undefined}
      >
        {hasChildren ? (
          <button
            type="button"
            className="-mr-1 grid h-11 w-6 shrink-0 cursor-pointer place-items-center border-0 bg-transparent p-0 text-fg-muted"
            aria-expanded={expanded}
            aria-controls={childrenId}
            aria-label={`${expanded ? 'Recolher' : 'Expandir'} ${node.name}`}
            onClick={(e) => {
              e.stopPropagation()
              setExpanded((v) => !v)
            }}
          >
            {expanded ? (
              <ChevronDown size={16} aria-hidden="true" />
            ) : (
              <ChevronRight size={16} aria-hidden="true" />
            )}
          </button>
        ) : (
          <span className="-mr-1 w-6 shrink-0" aria-hidden="true" />
        )}

        <CategoryBubble color={node.color} icon={node.icon} size={depth === 0 ? 'md' : 'sm'} />

        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span
            className={`truncate text-fg ${depth === 0 ? 'text-body font-semibold' : 'text-body-sm font-medium'}`}
          >
            {node.name}
          </span>
          {(meta || node.isDefault || node.isHidden || parentHidden || node.isArchived) && (
            <span className="flex flex-wrap items-center gap-1.5 text-[11px] leading-none text-fg-muted">
              {meta && <span>{meta}</span>}
              {node.isDefault && (
                <Tag title="Categoria do sistema: não pode ser editada nem arquivada, mas pode ser ocultada.">
                  Sistema
                </Tag>
              )}
              {node.isHidden ? (
                <Tag>Oculta</Tag>
              ) : (
                parentHidden && <Tag>Oculta pela categoria pai</Tag>
              )}
              {node.isArchived && <Tag>Arquivada</Tag>}
            </span>
          )}
        </span>

        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <ActionMenu label={`Ações de ${node.name}`} items={items} />
        </div>
      </div>

      {hasChildren && expanded && (
        <ul id={childrenId} className="m-0 p-0" aria-label={`Subcategorias de ${node.name}`}>
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
        </ul>
      )}
    </li>
  )
})
