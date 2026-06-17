import { useRef } from 'react'

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const color = value || '#4CAF50'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 8,
            background: color,
            border: '2px solid var(--border-strong)',
            cursor: 'pointer',
          }}
        />
        <input
          ref={inputRef}
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            width: '100%',
            height: '100%',
            cursor: 'pointer',
            padding: 0,
            border: 0,
          }}
          aria-label="Escolher cor"
        />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-dim)' }}>
        {color.toUpperCase()}
      </span>
    </div>
  )
}
