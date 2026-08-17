import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Plus, Search } from 'lucide-react'
import { IconBubble } from '@/components/ui/icon-bubble'
import { resolveCategoryIcon } from '@/features/categories/utils/category-icon'
import {
  buildCategoryGroups,
  filterCategoryGroups,
} from '@/features/categories/utils/category-groups'
import { CreateCategoryDialog } from '@/features/categories/components/create-category-dialog'
import type { Category } from '@/features/categories/types'

/** Altura máxima do popover; abaixo disso ele abre para cima. */
const POPOVER_MAX_HEIGHT = 340
const POPOVER_MIN_WIDTH = 280

interface PopoverPosition {
  top: number
  left: number
  width: number
  maxHeight: number
}

interface CategoryComboboxProps {
  value: string | null
  onChange: (categoryId: string | null) => void
  /** Árvore da API ou lista achatada — o componente reagrupa pelo `parentId`. */
  categories: Category[]
  /**
   * Nome a exibir quando o id selecionado ainda não está na lista carregada (ex.: a
   * sugestão que veio na prévia da importação antes de as categorias chegarem).
   */
  fallbackName?: string | null
  /** Rótulo da opção que limpa a seleção. */
  emptyLabel?: string
  placeholder?: string
  /** Mostra o atalho de cadastro rápido dentro do popover. */
  allowCreate?: boolean
  /** Linha auxiliar abaixo do gatilho (ex.: "sugerida automaticamente"). */
  hint?: ReactNode
  /** `field` tem altura de input; `inline` é o gatilho discreto das células de tabela. */
  variant?: 'field' | 'inline'
  disabled?: boolean
  className?: string
  'aria-label'?: string
  'aria-invalid'?: boolean | 'true' | 'false'
}

export function CategoryCombobox({
  value,
  onChange,
  categories,
  fallbackName,
  emptyLabel = 'Sem categoria',
  placeholder = 'Selecione uma categoria',
  allowCreate = true,
  hint,
  variant = 'field',
  disabled,
  className,
  'aria-label': ariaLabel = 'Categoria',
  'aria-invalid': ariaInvalid,
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [position, setPosition] = useState<PopoverPosition | null>(null)
  /** Guarda o pai sugerido do cadastro rápido; `null` = fechado. */
  const [creatingUnder, setCreatingUnder] = useState<{ parentId?: string; name: string } | null>(
    null,
  )

  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const listboxId = useRef(`cat-combo-${Math.random().toString(36).slice(2)}`)

  const groups = useMemo(() => buildCategoryGroups(categories), [categories])
  const visibleGroups = useMemo(() => filterCategoryGroups(groups, query), [groups, query])

  const parentOf = useMemo(() => {
    const map = new Map<string, Category>()
    for (const group of groups) {
      for (const child of group.children) map.set(child.id, group.root)
    }
    return map
  }, [groups])

  const selected = useMemo(() => {
    for (const group of groups) {
      if (group.root.id === value) return group.root
      const child = group.children.find((item) => item.id === value)
      if (child) return child
    }
    return null
  }, [groups, value])

  /** Ordem de navegação pelo teclado: a opção vazia e depois raiz → filhos de cada grupo. */
  const options = useMemo(() => {
    const flat: Array<string | null> = [null]
    for (const group of visibleGroups) {
      flat.push(group.root.id)
      for (const child of group.children) flat.push(child.id)
    }
    return flat
  }, [visibleGroups])

  useLayoutEffect(() => {
    if (!open) return

    function update() {
      const trigger = triggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      const width = Math.max(rect.width, POPOVER_MIN_WIDTH)
      const spaceBelow = window.innerHeight - rect.bottom - 8
      const spaceAbove = rect.top - 8
      // Dentro de um modal com tabela rolável sobra pouco espaço embaixo: nesse caso
      // o popover abre para cima em vez de ficar espremido em 60 px.
      const below = spaceBelow >= 220 || spaceBelow >= spaceAbove
      const maxHeight = Math.max(160, Math.min(POPOVER_MAX_HEIGHT, below ? spaceBelow : spaceAbove))
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
      setPosition({
        top: below ? rect.bottom + 4 : rect.top - 4 - maxHeight,
        left,
        width,
        maxHeight,
      })
    }

    update()
    window.addEventListener('resize', update)
    // `capture` para acompanhar o scroll de qualquer container ancestral, não só o da página.
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  // Mantém a opção ativa visível enquanto se navega com as setas.
  useEffect(() => {
    if (!open) return
    const active = listRef.current?.querySelector(`[data-index="${activeIndex}"]`)
    // O jsdom não implementa scrollIntoView, e isto roda em teste também.
    if (active instanceof HTMLElement && typeof active.scrollIntoView === 'function') {
      active.scrollIntoView({ block: 'nearest' })
    }
  }, [open, activeIndex])

  function openPopover() {
    if (disabled) return
    setQuery('')
    const index = options.indexOf(value ?? null)
    setActiveIndex(index >= 0 ? index : 0)
    setOpen(true)
  }

  function closePopover(focusTrigger = true) {
    setOpen(false)
    setQuery('')
    if (focusTrigger) triggerRef.current?.focus()
  }

  function select(categoryId: string | null) {
    onChange(categoryId)
    closePopover()
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (options.length === 0) return
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((current) => (current + step + options.length) % options.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (activeIndex < options.length) select(options[activeIndex])
    } else if (event.key === 'Escape') {
      // Sem parar a propagação o Escape chega ao Modal e fecha o diálogo inteiro —
      // o usuário perderia a revisão da importação para fechar uma lista.
      event.stopPropagation()
      closePopover()
    } else if (event.key === 'Tab') {
      closePopover(false)
    }
  }

  function startCreating(parentId?: string) {
    setCreatingUnder({ parentId, name: query.trim() })
    setOpen(false)
  }

  function handleCategoryCreated(category: Category) {
    onChange(category.id)
    setCreatingUnder(null)
  }

  const displayName = selected?.name ?? (value !== null ? (fallbackName ?? null) : null)
  const parent = selected ? parentOf.get(selected.id) : undefined

  function renderOption(category: Category, index: number, isChild: boolean) {
    const isSelected = category.id === value
    return (
      <button
        key={category.id}
        type="button"
        role="option"
        aria-selected={isSelected}
        data-index={index}
        className={`cat-combo-opt${isChild ? ' child' : ' root'}${
          index === activeIndex ? ' active' : ''
        }${isSelected ? ' on' : ''}`}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => select(category.id)}
      >
        <IconBubble
          aria-hidden
          color={category.color}
          size="sm"
          {...resolveCategoryIcon(category.icon)}
        />
        <span className="cat-combo-opt-name">{category.name}</span>
        {isSelected && <Check size={14} className="cat-combo-opt-check" aria-hidden="true" />}
      </button>
    )
  }

  // Índice 0 é sempre a opção vazia; o contador segue a mesma ordem de `options`,
  // que é o que a navegação por teclado percorre.
  let optionIndex = 0

  return (
    <div className={`cat-combo${className ? ` ${className}` : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId.current : undefined}
        aria-invalid={ariaInvalid}
        disabled={disabled}
        onClick={() => (open ? closePopover() : openPopover())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault()
            openPopover()
          }
        }}
        className={`cat-combo-trigger ${variant}${displayName ? '' : ' empty'}`}
      >
        {selected ? (
          <IconBubble
            aria-hidden
            color={selected.color}
            size="sm"
            {...resolveCategoryIcon(selected.icon)}
          />
        ) : (
          variant === 'field' && <span className="cat-combo-dot" aria-hidden="true" />
        )}
        <span className="cat-combo-value">
          {parent && <span className="cat-combo-parent">{parent.name} › </span>}
          {displayName ?? (variant === 'inline' ? emptyLabel : placeholder)}
        </span>
        <ChevronDown size={14} className="cat-combo-chevron" aria-hidden="true" />
      </button>

      {hint && <div className="cat-combo-hint">{hint}</div>}

      {open &&
        position &&
        createPortal(
          <div
            ref={popoverRef}
            className="cat-combo-pop"
            style={{ top: position.top, left: position.left, width: position.width }}
          >
            <div className="cat-combo-search">
              <Search size={14} aria-hidden="true" />
              <input
                autoFocus
                type="text"
                value={query}
                aria-label="Buscar categoria"
                aria-controls={listboxId.current}
                placeholder="Buscar categoria…"
                onChange={(event) => {
                  setQuery(event.target.value)
                  setActiveIndex(0)
                }}
                onKeyDown={handleSearchKeyDown}
              />
            </div>

            <div
              ref={listRef}
              id={listboxId.current}
              role="listbox"
              aria-label={ariaLabel}
              className="cat-combo-list"
              style={{ maxHeight: position.maxHeight - 92 }}
            >
              <button
                type="button"
                role="option"
                aria-selected={value === null}
                data-index={0}
                className={`cat-combo-opt none${activeIndex === 0 ? ' active' : ''}${
                  value === null ? ' on' : ''
                }`}
                onMouseEnter={() => setActiveIndex(0)}
                onClick={() => select(null)}
              >
                <span className="cat-combo-dot" aria-hidden="true" />
                <span className="cat-combo-opt-name">{emptyLabel}</span>
                {value === null && (
                  <Check size={14} className="cat-combo-opt-check" aria-hidden="true" />
                )}
              </button>

              {visibleGroups.map((group) => {
                const rootIndex = ++optionIndex
                return (
                  <div
                    key={group.root.id}
                    className="cat-combo-group"
                    role="group"
                    aria-label={group.root.name}
                  >
                    <div className="cat-combo-group-h">
                      {renderOption(group.root, rootIndex, false)}
                      {allowCreate && (
                        <button
                          type="button"
                          className="cat-combo-group-add"
                          title={`Nova subcategoria em ${group.root.name}`}
                          aria-label={`Nova subcategoria em ${group.root.name}`}
                          onClick={() => startCreating(group.root.id)}
                        >
                          <Plus size={13} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    {group.children.length > 0 && (
                      <div className="cat-combo-children">
                        {group.children.map((child) => renderOption(child, ++optionIndex, true))}
                      </div>
                    )}
                  </div>
                )
              })}

              {visibleGroups.length === 0 && (
                <div className="cat-combo-none">Nenhuma categoria encontrada</div>
              )}
            </div>

            {allowCreate && (
              <button type="button" className="cat-combo-create" onClick={() => startCreating()}>
                <Plus size={14} aria-hidden="true" />
                {query.trim() ? `Criar categoria “${query.trim()}”` : 'Nova categoria'}
              </button>
            )}
          </div>,
          document.body,
        )}

      {creatingUnder && (
        <CreateCategoryDialog
          open
          defaultName={creatingUnder.name}
          defaultParentId={creatingUnder.parentId}
          onClose={() => setCreatingUnder(null)}
          onCreated={handleCategoryCreated}
        />
      )}
    </div>
  )
}
