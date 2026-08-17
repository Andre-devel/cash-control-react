import { useEffect, useRef } from 'react'
import { CategoryCombobox } from '@/features/categories/components/category-combobox'
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

/**
 * Seletor de categoria dos formulários: o mesmo popover agrupado de [[CategoryCombobox]],
 * mais a sugestão automática a partir da descrição digitada.
 */
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

  function handleChange(categoryId: string | null) {
    userOverrodeRef.current = true
    onChange(categoryId ?? '')
  }

  const isSuggested = Boolean(suggested && suggested.id === value)

  return (
    <CategoryCombobox
      value={value || null}
      onChange={handleChange}
      categories={categories}
      className={className}
      disabled={disabled}
      aria-label={ariaLabel ?? 'Categoria'}
      aria-invalid={ariaInvalid}
      emptyLabel="Sem categoria"
      placeholder="Selecione uma categoria"
      hint={
        isSuggested ? (
          <span aria-live="polite">Sugerida automaticamente pela descrição</span>
        ) : undefined
      }
    />
  )
}
