import { resolveCategoryIcon } from '@/features/categories/utils/category-icon'
import { categoryColorCss } from '@/features/categories/utils/category-colors'

type CategoryBubbleSize = 'xs' | 'sm' | 'md' | 'lg'

const SIZES: Record<CategoryBubbleSize, { box: string; icon: number; font: string }> = {
  xs: { box: 'h-[22px] w-[22px] rounded-[7px]', icon: 12, font: 'text-[12px]' },
  sm: { box: 'h-6 w-6 rounded-xs', icon: 13, font: 'text-[13px]' },
  md: { box: 'h-9 w-9 rounded-sm', icon: 17, font: 'text-[17px]' },
  lg: { box: 'h-12 w-12 rounded-md', icon: 22, font: 'text-[22px]' },
}

interface CategoryBubbleProps {
  color?: string | null
  icon?: string | null
  size?: CategoryBubbleSize
}

/** Bolha de ícone da categoria: fundo = cor a 18%, ícone na cor cheia. Sempre decorativa. */
export function CategoryBubble({ color, icon, size = 'md' }: CategoryBubbleProps) {
  const { icon: Icon, glyph } = resolveCategoryIcon(icon)
  const s = SIZES[size]
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center leading-none ${s.box} ${s.font}`}
      style={{ background: categoryColorCss(color, 0.18), color: categoryColorCss(color) }}
    >
      {Icon ? <Icon size={s.icon} /> : glyph}
    </span>
  )
}
