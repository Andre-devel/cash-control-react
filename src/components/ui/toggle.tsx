interface ToggleProps {
  on: boolean
  onChange?: (value: boolean) => void
  /** Nome acessível, quando não há `<label>` em volta. */
  label?: string
  disabled?: boolean
}

export function Toggle({ on, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      className={`toggle${on ? ' on' : ''}`}
      onClick={() => onChange?.(!on)}
      aria-pressed={on}
      aria-label={label}
      disabled={disabled}
    />
  )
}
