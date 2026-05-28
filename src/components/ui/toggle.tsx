interface ToggleProps {
  on: boolean
  onChange?: (value: boolean) => void
}

export function Toggle({ on, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      className={`toggle${on ? ' on' : ''}`}
      onClick={() => onChange?.(!on)}
      aria-pressed={on}
    />
  )
}
