import { useEffect, useRef, type ChangeEvent } from 'react'
import { useSuggestCategory } from '@/features/categories/hooks/use-suggest-category'
import type { Category } from '@/features/categories/types'

interface CategoryPickerComboboxProps {
  value: string
  onChange: (categoryId: string) => void
  categories: Category[]
  description?: string
  className?: string
  'aria-label'?: string
  'aria-invalid'?: boolean | 'true' | 'false'
  disabled?: boolean
}

function flatWithDepth(categories: Category[], depth = 0): Array<{ cat: Category; depth: number }> {
  const result: Array<{ cat: Category; depth: number }> = []
  for (const cat of categories) {
    result.push({ cat, depth })
    if (cat.subcategories && cat.subcategories.length > 0) {
      result.push(...flatWithDepth(cat.subcategories, depth + 1))
    }
  }
  return result
}

export function CategoryPickerCombobox({
  value,
  onChange,
  categories,
  description,
  className,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
  disabled,
}: CategoryPickerComboboxProps) {
  const { data: suggested } = useSuggestCategory(description)
  const userOverrodeRef = useRef(false)

  useEffect(() => {
    if (suggested && suggested.id && !value && !userOverrodeRef.current) {
      onChange(suggested.id)
    }
  }, [suggested, value, onChange])

  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    userOverrodeRef.current = true
    onChange(e.target.value)
  }

  const isSuggested = suggested && suggested.id === value
  const flatCategories = flatWithDepth(categories)

  return (
    <div className="space-y-1">
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled}
        aria-label={ariaLabel ?? 'Category'}
        aria-invalid={ariaInvalid}
        className={`select${className ? ` ${className}` : ''}`}
      >
        <option value="">Select a category</option>
        {flatCategories.map(({ cat, depth }) => (
          <option key={cat.id} value={cat.id}>
            {' '.repeat(depth * 3)}
            {depth > 0 ? '↳ ' : ''}
            {cat.name}
          </option>
        ))}
      </select>

      {isSuggested && (
        <p className="text-xs text-dim" aria-live="polite">
          Auto-suggested based on description
        </p>
      )}
    </div>
  )
}
