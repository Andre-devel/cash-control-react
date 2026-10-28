import { IconBubble } from '@/components/ui/icon-bubble'
import {
  CATEGORY_ICON_OPTIONS,
  resolveCategoryIcon,
} from '@/features/categories/utils/category-icon'

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
  color?: string
}

export function IconPicker({ value, onChange, color }: IconPickerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconBubble color={color} {...resolveCategoryIcon(value)} />
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Pré-visualização</span>
      </div>
      <div className="icon-picker-grid">
        {CATEGORY_ICON_OPTIONS.map(({ name, label }) => {
          const selected = value === name
          const { icon: Icon } = resolveCategoryIcon(name)
          return (
            <button
              key={name}
              type="button"
              className={`icon-picker-btn${selected ? ' on' : ''}`}
              onClick={() => onChange(name)}
              aria-label={label}
              title={label}
              aria-pressed={selected}
            >
              {Icon && <Icon size={16} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
