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
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      {isSuggested && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Auto-suggested based on description
        </p>
      )}
    </div>
  )
}
