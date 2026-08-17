import type { CSSProperties, ComponentType, ReactNode } from 'react'

type IconBubbleSize = 'sm' | 'md' | 'lg' | 'xl'

interface IconBubbleProps {
  color?: string
  icon?: ComponentType<{ size?: number; stroke?: number }>
  size?: IconBubbleSize
  glyph?: ReactNode
  /** Um ícone-emoji vira texto no nome acessível de quem o envolve; some com ele
   *  quando o rótulo ao lado já diz a mesma coisa. */
  'aria-hidden'?: boolean
}

export function IconBubble({
  color = '#7c5cff',
  icon: Icon,
  size = 'md',
  glyph,
  'aria-hidden': ariaHidden,
}: IconBubbleProps) {
  const sizeClass = size !== 'md' ? ` ${size}` : ''
  return (
    <span
      aria-hidden={ariaHidden}
      className={`icon-bubble${sizeClass}`}
      style={
        {
          '--icon-bg': `${color}22`,
          '--icon-fg': color,
          color,
        } as CSSProperties
      }
    >
      {Icon ? <Icon /> : glyph}
    </span>
  )
}
