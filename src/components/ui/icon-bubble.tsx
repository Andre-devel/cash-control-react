import type { CSSProperties, ComponentType, ReactNode } from 'react'

type IconBubbleSize = 'sm' | 'md' | 'lg' | 'xl'

interface IconBubbleProps {
  color?: string
  icon?: ComponentType<{ size?: number; stroke?: number }>
  size?: IconBubbleSize
  glyph?: ReactNode
}

export function IconBubble({ color = '#7c5cff', icon: Icon, size = 'md', glyph }: IconBubbleProps) {
  const sizeClass = size !== 'md' ? ` ${size}` : ''
  return (
    <span
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
