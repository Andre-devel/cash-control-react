import { useRef, type KeyboardEvent } from 'react'
import { Check, Pipette, Shuffle } from 'lucide-react'
import {
  CATEGORY_PALETTE,
  categoryColorToken,
  randomCategoryColor,
} from '@/features/categories/utils/category-colors'

interface CategoryColorPickerProps {
  value: string
  onChange: (hex: string) => void
}

const SWATCH =
  'grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-[14px] border-0 p-0 text-bg outline-none transition-shadow focus-visible:shadow-[0_0_0_2px_rgb(var(--cc-bg)),0_0_0_4px_rgb(var(--cc-focus))]'
const RING = '0 0 0 2px rgb(var(--cc-bg)), 0 0 0 4px rgb(var(--cc-text))'

/**
 * Paleta categórica como radiogroup (setas trocam a cor). Uma cor gravada fora da paleta
 * — categorias antigas — aparece como "Personalizada" e continua editável no seletor nativo.
 */
export function CategoryColorPicker({ value, onChange }: CategoryColorPickerProps) {
  const groupRef = useRef<HTMLDivElement>(null)
  const token = categoryColorToken(value)
  const isCustom = token === null && /^#[0-9a-f]{6}$/i.test(value)

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']
    if (!keys.includes(event.key)) return
    event.preventDefault()
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1
    const current = token === null ? 0 : token - 1
    const next = (current + step + CATEGORY_PALETTE.length) % CATEGORY_PALETTE.length
    onChange(CATEGORY_PALETTE[next].hex)
    groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus()
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label="Cor"
        className="grid grid-cols-[repeat(5,44px)] gap-2"
        onKeyDown={handleKeyDown}
      >
        {CATEGORY_PALETTE.map((c, i) => {
          const selected = token === i + 1
          const tabbable = selected || (token === null && i === 0)
          return (
            <button
              key={c.hex}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={c.name}
              title={c.name}
              tabIndex={tabbable ? 0 : -1}
              onClick={() => onChange(c.hex)}
              className={SWATCH}
              style={{
                background: `rgb(var(--cc-cat-${i + 1}))`,
                boxShadow: selected ? RING : undefined,
              }}
            >
              {selected && <Check size={18} aria-hidden="true" />}
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <label className="inline-flex min-h-touch w-fit cursor-pointer items-center gap-2 text-body-sm text-fg-muted">
          <span
            className="relative grid h-8 w-8 place-items-center rounded-sm border border-border-strong"
            style={{
              background: isCustom ? value : 'transparent',
              boxShadow: isCustom ? RING : undefined,
            }}
          >
            {!isCustom && <Pipette size={14} aria-hidden="true" />}
            <input
              type="color"
              value={isCustom ? value : (CATEGORY_PALETTE[(token ?? 1) - 1]?.hex ?? '#5CE1B8')}
              onChange={(e) => onChange(e.target.value.toUpperCase())}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Cor personalizada"
            />
          </span>
          {isCustom ? (
            <span>
              Personalizada <span className="font-mono">{value.toUpperCase()}</span>
            </span>
          ) : (
            'Cor personalizada'
          )}
        </label>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onChange(randomCategoryColor(value))}
        >
          <Shuffle size={16} aria-hidden="true" />
          Aleatória
        </button>
      </div>
    </div>
  )
}
