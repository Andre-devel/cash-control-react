import { CategoryBubble } from './category-bubble'
import { CATEGORY_PALETTE, categoryColorToken } from '@/features/categories/utils/category-colors'

interface CategoryPreviewProps {
  name: string
  color: string
  icon: string
}

/** Prévia ao vivo de como a categoria vai aparecer nas listas. */
export function CategoryPreview({ name, color, icon }: CategoryPreviewProps) {
  const token = categoryColorToken(color)
  const colorName = token !== null ? CATEGORY_PALETTE[token - 1].name : color.toUpperCase()
  return (
    <div
      className="flex items-center gap-3.5 rounded-lg bg-surface-2 p-3"
      aria-label="Pré-visualização"
      role="group"
    >
      <CategoryBubble color={color} icon={icon} size="lg" />
      <span className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-body font-semibold text-fg">
          {name.trim() || 'Nova categoria'}
        </span>
        <span className="font-mono text-caption text-fg-muted">{colorName}</span>
      </span>
    </div>
  )
}
