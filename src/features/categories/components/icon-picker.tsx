import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Search } from 'lucide-react'
import {
  CATEGORY_ICON_OPTIONS,
  resolveCategoryIcon,
} from '@/features/categories/utils/category-icon'
import { normalizeForSearch } from '@/features/categories/utils/category-groups'

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
  /** Mantido por compatibilidade: a prévia com a cor fica no formulário. */
  color?: string
}

/** Grade de ícones (radiogroup) com busca — são mais de 40 opções. */
export function IconPicker({ value, onChange }: IconPickerProps) {
  const [query, setQuery] = useState('')
  const gridRef = useRef<HTMLDivElement>(null)

  const options = useMemo(() => {
    const term = normalizeForSearch(query.trim())
    if (!term) return CATEGORY_ICON_OPTIONS
    return CATEGORY_ICON_OPTIONS.filter((o) => normalizeForSearch(o.label).includes(term))
  }, [query])

  const selectedIndex = options.findIndex((o) => o.name === value)

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']
    if (!keys.includes(event.key) || options.length === 0) return
    event.preventDefault()
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1
    const current = selectedIndex === -1 ? 0 : selectedIndex
    const next = (current + step + options.length) % options.length
    onChange(options[next].name)
    gridRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-11 items-center gap-2 rounded-md border border-border bg-surface-1 px-3 text-fg-muted focus-within:border-brand">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ícone…"
          aria-label="Buscar ícone"
          className="h-full min-w-0 flex-1 border-0 bg-transparent text-base text-fg outline-none md:text-body-sm"
        />
      </div>
      <div
        ref={gridRef}
        role="radiogroup"
        aria-label="Ícone"
        onKeyDown={handleKeyDown}
        className="grid max-h-[220px] grid-cols-[repeat(auto-fill,44px)] gap-1.5 overflow-y-auto rounded-md border border-border bg-surface-2 p-2"
      >
        {options.map(({ name, label }, i) => {
          const selected = value === name
          const tabbable = selected || (selectedIndex === -1 && i === 0)
          const { icon: Icon } = resolveCategoryIcon(name)
          return (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={label}
              title={label}
              tabIndex={tabbable ? 0 : -1}
              onClick={() => onChange(name)}
              className={`grid h-11 w-11 cursor-pointer place-items-center rounded-sm border p-0 outline-none transition-colors focus-visible:shadow-[0_0_0_2px_rgb(var(--cc-bg)),0_0_0_4px_rgb(var(--cc-focus))] ${
                selected
                  ? 'border-brand bg-brand-soft text-brand-text'
                  : 'border-transparent bg-transparent text-fg hover:bg-surface-3'
              }`}
            >
              {Icon && <Icon size={19} />}
            </button>
          )
        })}
        {options.length === 0 && (
          <p className="col-span-full m-0 p-2 text-body-sm text-fg-muted">
            Nenhum ícone para “{query}”.
          </p>
        )}
      </div>
    </div>
  )
}
