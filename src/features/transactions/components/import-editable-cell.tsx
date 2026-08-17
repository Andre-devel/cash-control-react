import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { CategoryCombobox } from '@/features/categories/components/category-combobox'
import type { Category } from '@/features/categories/types'

/**
 * Célula que só vira campo quando clicada.
 *
 * Um extrato de dois anos tem ~700 linhas; renderizar um input em cada uma significaria
 * centenas de controles de formulário no DOM. Editar sob demanda mantém a tabela leve e
 * não muda nada para quem só quer conferir e confirmar.
 */
interface EditableTextCellProps {
  value: string
  /** Rótulo acessível, já que a célula não tem `<label>` visível. */
  label: string
  onChange: (value: string) => void
  edited: boolean
}

export function EditableTextCell({ value, label, onChange, edited }: EditableTextCellProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function commit() {
    const trimmed = draft.trim()
    // Descrição é obrigatória no backend (@NotBlank): esvaziar volta ao valor anterior.
    if (trimmed) onChange(trimmed)
    else setDraft(value)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        type="button"
        aria-label={label}
        onClick={() => {
          setDraft(value)
          setEditing(true)
        }}
        style={{
          background: 'none',
          border: 0,
          padding: 0,
          font: 'inherit',
          color: 'inherit',
          textAlign: 'left',
          cursor: 'text',
          borderBottom: '1px dashed var(--border)',
        }}
      >
        {value}
        {edited && (
          <span style={{ color: 'var(--text-faint)', marginLeft: 6, fontSize: 11 }}>(editada)</span>
        )}
      </button>
    )
  }

  return (
    <Input
      ref={inputRef}
      aria-label={label}
      value={draft}
      maxLength={255}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          commit()
        } else if (e.key === 'Escape') {
          // Sem parar a propagação, o Escape chega ao listener do Modal e fecha o
          // diálogo inteiro — o usuário perderia toda a revisão para desfazer a
          // edição de uma célula.
          e.stopPropagation()
          setDraft(value)
          setEditing(false)
        }
      }}
      style={{ minWidth: 180 }}
    />
  )
}

interface EditableCategoryCellProps {
  value: string | null
  label: string
  /** Árvore de categorias — o seletor mostra raízes e subcategorias separadas. */
  categories: Category[]
  /**
   * Nome que a prévia já trouxe para a categoria sugerida. Serve enquanto a lista de
   * categorias não terminou de carregar: sem ele, a linha mostraria "sem categoria"
   * mesmo tendo sugestão.
   */
  fallbackName?: string | null
  onChange: (categoryId: string | null) => void
}

export function EditableCategoryCell({
  value,
  label,
  categories,
  fallbackName,
  onChange,
}: EditableCategoryCellProps) {
  // Ao contrário das outras células, esta não precisa do clique-para-editar: o gatilho é
  // só um botão, e a lista (com busca e cadastro rápido) só monta quando é aberta.
  return (
    <CategoryCombobox
      variant="inline"
      aria-label={label}
      value={value}
      categories={categories}
      fallbackName={fallbackName}
      emptyLabel="sem categoria"
      onChange={onChange}
    />
  )
}
