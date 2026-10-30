interface SegmentedProps<T extends string> {
  label: string
  options: { id: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

/** Abas compactas no padrão das pílulas da projeção de saldo. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  return (
    <div className="flex rounded-lg bg-surface-2 p-[3px]" role="tablist" aria-label={label}>
      {options.map((option) => {
        const on = value === option.id
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(option.id)}
            className={`min-h-[36px] rounded-md px-3 text-caption font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus ${
              on ? 'bg-surface-3 text-fg' : 'text-fg-muted'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
