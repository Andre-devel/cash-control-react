import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { ROUTES } from '@/app/router/routes'
import { Modal } from '@/components/ui/modal'
import { Money } from '@/components/ui/money'
import { MOBILE_QUERY, useMediaQuery } from '@/hooks/use-media-query'
import { formatShortDate } from '@/lib/format-date'
import { SEARCH_MIN_LENGTH, useGlobalSearch } from '@/features/search/hooks/use-global-search'
import type { SearchResponse } from '@/features/search/types'

interface SearchOption {
  /** Único no listbox: vira o `id` do DOM e o `aria-activedescendant`. */
  key: string
  title: string
  subtitle: string | null
  meta?: ReactNode
  href: string
}

interface SearchGroup {
  key: string
  label: string
  options: SearchOption[]
}

/** Sem página de detalhe para categoria, recorrência e parcelamento: vão para a lista. */
function buildGroups(data: SearchResponse | undefined): SearchGroup[] {
  if (!data) return []
  const groups: SearchGroup[] = [
    {
      key: 'transactions',
      label: 'Transações',
      options: data.transactions.map((t) => ({
        key: `transactions-${t.id}`,
        title: t.title,
        subtitle: t.subtitle,
        meta: (
          <>
            <span>{formatShortDate(t.date)}</span>
            <Money value={Number(t.amount)} />
          </>
        ),
        href: ROUTES.TRANSACTION_DETAIL.replace(':id', t.id),
      })),
    },
    {
      key: 'accounts',
      label: 'Contas',
      options: data.accounts.map((a) => ({
        key: `accounts-${a.id}`,
        title: a.title,
        subtitle: a.subtitle,
        href: ROUTES.ACCOUNT_DETAIL.replace(':id', encodeURIComponent(a.id)),
      })),
    },
    {
      key: 'cards',
      label: 'Cartões',
      options: data.creditCards.map((c) => ({
        key: `cards-${c.id}`,
        title: c.title,
        subtitle: c.subtitle,
        href: ROUTES.CARD_DETAIL.replace(':id', c.id),
      })),
    },
    {
      key: 'categories',
      label: 'Categorias',
      options: data.categories.map((c) => ({
        key: `categories-${c.id}`,
        title: c.title,
        subtitle: c.subtitle,
        href: `${ROUTES.TRANSACTIONS}?categoryId=${encodeURIComponent(c.id)}`,
      })),
    },
    {
      key: 'recurrences',
      label: 'Recorrências',
      options: data.recurrences.map((r) => ({
        key: `recurrences-${r.id}`,
        title: r.title,
        subtitle: r.subtitle,
        href: ROUTES.RECURRENCES,
      })),
    },
    {
      key: 'installments',
      label: 'Parcelamentos',
      options: data.installments.map((i) => ({
        key: `installments-${i.id}`,
        title: i.title,
        subtitle: i.subtitle,
        href: ROUTES.INSTALLMENTS,
      })),
    },
  ]
  return groups.filter((g) => g.options.length > 0)
}

function seeAllHref(q: string): string {
  return `${ROUTES.TRANSACTIONS}?searchText=${encodeURIComponent(q)}`
}

interface SearchComboboxProps {
  inputRef: RefObject<HTMLInputElement | null>
  /** `inline`: lista suspensa sob o campo da topbar. `sheet`: lista fixa na folha do celular. */
  variant: 'inline' | 'sheet'
  onNavigated: () => void
}

/**
 * Campo + lista de resultados no padrão combobox do WAI-ARIA: o foco fica no campo e a opção
 * ativa é indicada por `aria-activedescendant`, com ↑↓ para mover, Enter para abrir e Esc para
 * fechar.
 */
function SearchCombobox({ inputRef, variant, onNavigated }: SearchComboboxProps) {
  const navigate = useNavigate()
  const baseId = useId()
  const listboxId = `${baseId}-listbox`
  const [q, setQ] = useState('')
  const [focused, setFocused] = useState(variant === 'sheet')
  // Pela chave, não pelo índice: quando a lista muda, uma opção que saiu deixa de estar ativa.
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const { data, isFetching, isError, debouncedQuery, enabled } = useGlobalSearch(q)

  const trimmed = q.trim()
  const groups = useMemo(() => buildGroups(data), [data])
  const seeAll: SearchOption | null = enabled
    ? {
        key: 'see-all',
        title: 'Ver todas as transações',
        subtitle: `com “${debouncedQuery}”`,
        href: seeAllHref(debouncedQuery),
      }
    : null
  const options = [...groups.flatMap((g) => g.options), ...(seeAll ? [seeAll] : [])]
  const activeIndex = options.findIndex((o) => o.key === activeKey)
  const expanded = variant === 'sheet' ? trimmed.length > 0 : focused && trimmed.length > 0
  const optionId = (key: string) => `${baseId}-${key}`
  const active = activeIndex >= 0 ? options[activeIndex] : undefined

  function go(href: string) {
    setQ('')
    setActiveKey(null)
    if (variant === 'inline') inputRef.current?.blur()
    onNavigated()
    void navigate(href)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case 'ArrowDown':
        if (options.length === 0) return
        e.preventDefault()
        setFocused(true)
        setActiveKey(options[(activeIndex + 1) % options.length].key)
        break
      case 'ArrowUp':
        if (options.length === 0) return
        e.preventDefault()
        setActiveKey(options[activeIndex <= 0 ? options.length - 1 : activeIndex - 1].key)
        break
      case 'Enter':
        e.preventDefault()
        if (active) go(active.href)
        else if (trimmed.length >= SEARCH_MIN_LENGTH) go(seeAllHref(trimmed))
        break
      case 'Escape':
        // Na folha quem fecha é o Modal (Esc no documento).
        if (variant === 'sheet') return
        e.preventDefault()
        if (expanded) setFocused(false)
        else {
          setQ('')
          inputRef.current?.blur()
        }
        break
    }
  }

  let status: ReactNode = null
  if (trimmed.length > 0 && trimmed.length < SEARCH_MIN_LENGTH) {
    status = `Digite ao menos ${SEARCH_MIN_LENGTH} caracteres.`
  } else if (enabled && isError) {
    status = 'Não foi possível buscar agora.'
  } else if (enabled && !data && isFetching) {
    status = 'Buscando…'
  } else if (enabled && data && groups.length === 0) {
    status = `Nada encontrado para “${debouncedQuery}”.`
  }

  const renderOption = (option: SearchOption, index: number) => (
    <li
      key={option.key}
      id={optionId(option.key)}
      role="option"
      aria-selected={index === activeIndex}
      className={`global-search-option${index === activeIndex ? ' active' : ''}${option.key === 'see-all' ? ' see-all' : ''}`}
      // Mantém o foco no campo: sem isso o blur fecharia a lista antes do clique.
      onMouseDown={(e) => e.preventDefault()}
      onMouseEnter={() => setActiveKey(option.key)}
      onClick={() => go(option.href)}
    >
      <span className="global-search-option-text">
        <span className="title">{option.title}</span>
        {option.subtitle && <span className="sub">{option.subtitle}</span>}
      </span>
      {option.meta && <span className="global-search-option-meta">{option.meta}</span>}
    </li>
  )

  let index = 0
  return (
    <div className={`global-search global-search-${variant}`}>
      <div className="global-search-field">
        <Search size={16} aria-hidden="true" className="global-search-icon" />
        <input
          ref={inputRef}
          type="search"
          className="input"
          role="combobox"
          aria-label="Buscar"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={listboxId}
          aria-activedescendant={active && expanded ? optionId(active.key) : undefined}
          placeholder="Buscar transações, contas, cartões…"
          autoComplete="off"
          enterKeyHint="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => variant === 'inline' && setFocused(false)}
          onKeyDown={handleKeyDown}
        />
        {variant === 'inline' && (
          <kbd className="global-search-kbd" aria-hidden="true">
            Ctrl K
          </kbd>
        )}
      </div>
      <div className="global-search-results" hidden={!expanded}>
        {status && (
          <p className="global-search-status" role="status">
            {status}
          </p>
        )}
        <ul id={listboxId} role="listbox" aria-label="Resultados da busca">
          {groups.map((group) => (
            <li key={group.key} role="presentation">
              <div className="global-search-group-label" id={`${baseId}-group-${group.key}`}>
                {group.label}
              </div>
              <ul role="group" aria-labelledby={`${baseId}-group-${group.key}`}>
                {group.options.map((option) => renderOption(option, index++))}
              </ul>
            </li>
          ))}
          {seeAll && renderOption(seeAll, index++)}
        </ul>
      </div>
    </div>
  )
}

/**
 * Busca global. No tablet/desktop é um campo na topbar com lista suspensa; no celular (onde a
 * topbar some) é uma lupa flutuante que abre a busca numa folha de tela cheia. `Ctrl+K` /
 * `Cmd+K` foca o campo ou abre a folha.
 */
export function GlobalSearch() {
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const [sheetOpen, setSheetOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const closeSheet = useCallback(() => setSheetOpen(false), [])

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'k') return
      e.preventDefault()
      if (isMobile) setSheetOpen(true)
      else {
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isMobile])

  // Foca o campo da folha ao abrir (antes de o Modal decidir o foco inicial).
  useEffect(() => {
    if (sheetOpen) inputRef.current?.focus()
  }, [sheetOpen])

  if (!isMobile) {
    return <SearchCombobox inputRef={inputRef} variant="inline" onNavigated={() => undefined} />
  }

  return (
    <>
      {createPortal(
        <button
          type="button"
          className="global-search-fab"
          aria-label="Buscar"
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          onClick={() => setSheetOpen(true)}
        >
          <Search size={20} aria-hidden="true" />
        </button>,
        document.body,
      )}
      {sheetOpen && (
        <Modal title="Buscar" onClose={closeSheet} panel>
          <SearchCombobox inputRef={inputRef} variant="sheet" onNavigated={closeSheet} />
        </Modal>
      )}
    </>
  )
}
