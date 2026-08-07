import { IconBubble } from '@/components/ui/icon-bubble'
import { resolveCategoryIcon } from '@/features/categories/utils/category-icon'

const ICONS = [
  '🍕',
  '🍔',
  '🛒',
  '🥗',
  '☕',
  '🍷',
  '🥩',
  '🍰',
  '🚗',
  '✈️',
  '🚌',
  '⛽',
  '🚲',
  '🚢',
  '🏍️',
  '🚆',
  '🏠',
  '🛋️',
  '💡',
  '💧',
  '🔌',
  '📦',
  '🔑',
  '🛏️',
  '💊',
  '🏥',
  '🩺',
  '💪',
  '🏃',
  '🧘',
  '🦷',
  '👓',
  '🎮',
  '🎬',
  '🎵',
  '📚',
  '🎯',
  '🎭',
  '🎨',
  '🎲',
  '👕',
  '👟',
  '👜',
  '🛍️',
  '💄',
  '💍',
  '🧴',
  '🧢',
  '💰',
  '💳',
  '🏦',
  '💵',
  '📊',
  '💹',
  '🪙',
  '📈',
  '🐶',
  '🐱',
  '🌿',
  '🎁',
  '⭐',
  '🏷️',
  '🌍',
  '🎓',
]

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
  color?: string
}

export function IconPicker({ value, onChange, color }: IconPickerProps) {
  const preview = value || '🏷️'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconBubble color={color} {...resolveCategoryIcon(preview)} />
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Pré-visualização</span>
      </div>
      <div className="icon-picker-grid">
        {ICONS.map((icon) => {
          const selected = value === icon
          return (
            <button
              key={icon}
              type="button"
              className={`icon-picker-btn${selected ? ' on' : ''}`}
              onClick={() => onChange(icon)}
              aria-label={icon}
              aria-pressed={selected}
            >
              {icon}
            </button>
          )
        })}
      </div>
    </div>
  )
}
