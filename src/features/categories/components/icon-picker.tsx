import { IconBubble } from '@/components/ui/icon-bubble'

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
        <IconBubble color={color} glyph={preview} />
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Pré-visualização</span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: 4,
          maxHeight: 164,
          overflowY: 'auto',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 8,
          background: 'var(--surface-2)',
        }}
      >
        {ICONS.map((icon) => {
          const selected = value === icon
          return (
            <button
              key={icon}
              type="button"
              onClick={() => onChange(icon)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                border: selected ? '2px solid var(--accent)' : '2px solid transparent',
                background: selected ? 'var(--accent-soft)' : 'transparent',
                cursor: 'pointer',
                fontSize: 17,
                display: 'grid',
                placeItems: 'center',
                padding: 0,
                transition: 'background 80ms, border-color 80ms',
              }}
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
